#!/usr/bin/env python3

import json
import os
import ssl
import sys
import time
from subprocess import run
from urllib import error, parse, request


USAGE = """yida-data.py - Unified Yida data CLI

Usage:
  python3 scripts/yida-data.py query form <appType> <formUuid> [--page N] [--size N] [--search-json JSON] [--inst-id ID]
  python3 scripts/yida-data.py get form <appType> --inst-id <formInstId>
  python3 scripts/yida-data.py create form <appType> <formUuid> --data-json <JSON> [--dept-id ID]
  python3 scripts/yida-data.py update form <appType> --inst-id <formInstId> --data-json <JSON> [--use-latest-version y]
  python3 scripts/yida-data.py query subform <appType> <formUuid> --inst-id <formInstId> --table-field-id <fieldId> [--page N] [--size N]

  python3 scripts/yida-data.py query process <appType> <formUuid> [--page N] [--size N] [--search-json JSON] [--task-id ID] [--instance-status STATUS] [--approved-result RESULT]
  python3 scripts/yida-data.py get process <appType> --process-inst-id <processInstanceId>
  python3 scripts/yida-data.py create process <appType> <formUuid> --process-code <processCode> --data-json <JSON> [--dept-id ID]
  python3 scripts/yida-data.py update process <appType> --process-inst-id <processInstanceId> --data-json <JSON>
  python3 scripts/yida-data.py query operation-records <appType> --process-inst-id <processInstanceId>
  python3 scripts/yida-data.py execute task <appType> --task-id <taskId> --process-inst-id <processInstanceId> --out-result <AGREE|DISAGREE> --remark <text> [--data-json JSON] [--no-execute-expressions y]

  python3 scripts/yida-data.py query tasks <appType> --type <todo|done|submitted|cc> [--page N] [--size N] [--keyword TEXT] [--process-codes JSON] [--instance-status STATUS]
"""


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def fail(message):
    print(message, file=sys.stderr)
    print(USAGE, file=sys.stderr)
    sys.exit(1)


def parse_error(message):
    print(f"参数校验失败：{message}", file=sys.stderr)
    print(USAGE, file=sys.stderr)
    sys.exit(1)


def find_project_root():
    cwd = os.getcwd()
    current = cwd
    while current != "/":
        if os.path.exists(os.path.join(current, ".cache")) or os.path.exists(os.path.join(current, "config.json")):
            return current
        parent = os.path.dirname(current)
        if parent == current:
            break
        current = parent
    return cwd


PROJECT_ROOT = find_project_root()


def find_cookie_file():
    project_cookie = os.path.join(PROJECT_ROOT, ".cache", "cookies.json")
    if os.path.exists(project_cookie):
        return project_cookie

    cwd_cookie = os.path.join(os.getcwd(), ".cache", "cookies.json")
    if os.path.exists(cwd_cookie):
        return cwd_cookie

    home_cookie = os.path.expanduser("~/.config/openyida/cookies.json")
    if os.path.exists(home_cookie):
        return home_cookie

    return project_cookie


def find_config_file():
    project_config = os.path.join(PROJECT_ROOT, "config.json")
    if os.path.exists(project_config):
        return project_config
    return os.path.join(os.getcwd(), "config.json")


COOKIE_FILE = find_cookie_file()
CONFIG_FILE = find_config_file()


def find_openyida_cli():
    try:
        import shutil

        global_path = shutil.which("openyida")
        if global_path:
            return global_path
    except Exception:
        pass

    npm_path = os.path.join(PROJECT_ROOT, "node_modules", ".bin", "openyida")
    if os.path.exists(npm_path):
        return npm_path

    bin_path = os.path.join(PROJECT_ROOT, "bin", "yida.js")
    if os.path.exists(bin_path):
        return bin_path

    return None


OPENYIDA_CLI = find_openyida_cli()


def load_config():
    if not os.path.exists(CONFIG_FILE):
        return {"defaultBaseUrl": "https://www.aliwork.com"}
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


CONFIG = load_config()
DEFAULT_BASE_URL = CONFIG.get("defaultBaseUrl", "https://www.aliwork.com")


def load_cookie_data():
    cookie_file = find_cookie_file()
    if not os.path.exists(cookie_file):
        return None
    try:
        with open(cookie_file, "r", encoding="utf-8") as f:
            content = f.read().strip()
        if not content:
            return None
        data = json.loads(content)
        if isinstance(data, dict) and "cookies" in data:
            return data
        if isinstance(data, list) and data:
            return {"cookies": data, "base_url": DEFAULT_BASE_URL}
        return None
    except (json.JSONDecodeError, ValueError):
        return None


def extract_csrf_token(cookies):
    for cookie in cookies:
        if cookie.get("name") == "tianshu_csrf_token":
            return cookie.get("value")
    return None


def trigger_login():
    print("\n🔐 登录态失效，正在调用 openyida login 重新登录...\n", file=sys.stderr)

    if not OPENYIDA_CLI:
        fail("未找到 openyida CLI 工具，请确保已安装 openyida")

    cli_path = OPENYIDA_CLI
    if not cli_path:
        fail("未找到 openyida CLI 工具，请确保已安装 openyida")
    assert cli_path is not None

    if cli_path.endswith(".js"):
        cmd = ["node", cli_path, "login"]
    else:
        cmd = [cli_path, "login"]

    result = run(cmd, capture_output=True, text=True, timeout=180)
    if result.returncode != 0:
        fail(f"登录失败：{result.stderr}")

    cookie_data = load_cookie_data()
    if not cookie_data or not cookie_data.get("cookies"):
        fail("登录后无法加载 Cookie")
    return cookie_data


def ensure_login():
    cookie_data = load_cookie_data()
    if not cookie_data:
        cookie_data = trigger_login()
    assert cookie_data is not None

    cookies = cookie_data.get("cookies", [])
    csrf_token = extract_csrf_token(cookies)
    if not csrf_token:
        cookie_data = trigger_login()
        assert cookie_data is not None
        cookies = cookie_data.get("cookies", [])
        csrf_token = extract_csrf_token(cookies)

    if not cookie_data or not csrf_token:
        fail("无法获取有效登录态或 CSRF Token")
    assert cookie_data is not None

    cookie_data["csrf_token"] = csrf_token
    cookie_data["base_url"] = cookie_data.get("base_url", DEFAULT_BASE_URL)
    return cookie_data


def parse_cli_options(tokens):
    positionals = []
    options = {}
    i = 0
    while i < len(tokens):
        token = tokens[i]
        if token.startswith("--"):
            key = token[2:].replace("-", "_")
            if i + 1 < len(tokens) and not tokens[i + 1].startswith("--"):
                options[key] = tokens[i + 1]
                i += 2
            else:
                options[key] = True
                i += 1
        else:
            positionals.append(token)
            i += 1
    return positionals, options


def clamp_page_size(options, default=20):
    try:
        size = int(options.get("size", default))
    except ValueError:
        size = default
    if size > 100:
        size = 100
    if size <= 0:
        size = default
    options["size"] = size

    try:
        page = int(options.get("page", 1))
    except ValueError:
        page = 1
    if page <= 0:
        page = 1
    options["page"] = page


def common_headers(base_url, cookies, app_type):
    cookie_header = "; ".join([f"{c['name']}={c['value']}" for c in cookies])
    return {
        "Origin": base_url,
        "Referer": f"{base_url}/{app_type}/workbench",
        "Cookie": cookie_header,
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
    }


def send_request(base_url, cookies, csrf_token, app_type, path, method="GET", params=None, max_retries=3):
    params = dict(params or {})
    params.setdefault("_api", "nattyFetch")
    params.setdefault("_mock", "false")
    params.setdefault("_csrf_token", csrf_token)
    params.setdefault("_stamp", str(int(time.time() * 1000)))

    headers = common_headers(base_url, cookies, app_type)
    context = ssl.create_default_context()

    if method == "GET":
        query = parse.urlencode(params)
        url = f"{base_url}{path}?{query}"
        req = request.Request(url, headers=headers, method="GET")
    else:
        body = parse.urlencode(params).encode("utf-8")
        headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8"
        url = f"{base_url}{path}"
        req = request.Request(url, headers=headers, data=body, method=method)

    for attempt in range(max_retries):
        try:
            with request.urlopen(req, timeout=30, context=context) as response:
                return json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            if exc.code == 429 and attempt < max_retries - 1:
                time.sleep(1)
                continue
            content = exc.read().decode("utf-8")
            try:
                return json.loads(content)
            except Exception:
                return {"success": False, "errorMsg": f"HTTP {exc.code}: {content[:200]}"}
        except Exception as exc:
            return {"success": False, "errorMsg": str(exc)}

    return {"success": False, "errorMsg": "请求失败：超过最大重试次数"}


def print_result(result):
    error_code = result.get("errorCode")
    has_error_code = error_code not in (None, "", 0, "0")

    if result.get("success") and not has_error_code:
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return

    print(json.dumps(result, ensure_ascii=False, indent=2), file=sys.stderr)
    sys.exit(1)


def require_positionals(positionals, count, names):
    if len(positionals) < count:
        parse_error(f"缺少必填参数 {' '.join(names)}")


def require_option(options, key, flag_name=None):
    if not options.get(key):
        parse_error(f"缺少必填参数 {flag_name or '--' + key.replace('_', '-')}")


def query_form(positionals, options, session):
    require_positionals(positionals, 2, ["appType", "formUuid"])
    app_type, form_uuid = positionals[0], positionals[1]
    clamp_page_size(options)
    base_url = session["base_url"].rstrip("/")
    cookies = session["cookies"]
    csrf_token = session["csrf_token"]

    if options.get("inst_id"):
        params = {"formInstId": options["inst_id"]}
        result = send_request(base_url, cookies, csrf_token, app_type, f"/dingtalk/web/{app_type}/v1/form/getFormDataById.json", params=params)
    else:
        params = {
            "formUuid": form_uuid,
            "appType": app_type,
            "currentPage": str(options["page"]),
            "pageSize": str(options["size"]),
        }
        if options.get("search_json"):
            params["searchFieldJson"] = options["search_json"]
        for key in ["originator_id", "create_from", "create_to", "modified_from", "modified_to", "dynamic_order"]:
            if options.get(key):
                params[snake_to_camel(key)] = options[key]
        path = f"/dingtalk/web/{app_type}/v1/form/searchFormDatas.json"
        if options.get("ids_only"):
            path = f"/dingtalk/web/{app_type}/v1/form/searchFormDataIds.json"
        result = send_request(base_url, cookies, csrf_token, app_type, path, params=params)

    print_result(result)


def get_form(positionals, options, session):
    require_positionals(positionals, 1, ["appType"])
    require_option(options, "inst_id")
    query_form([positionals[0], "_"], {"inst_id": options["inst_id"], "page": 1, "size": 1}, session)


def create_form(positionals, options, session):
    require_positionals(positionals, 2, ["appType", "formUuid"])
    require_option(options, "data_json")
    app_type, form_uuid = positionals[0], positionals[1]
    params = {
        "appType": app_type,
        "formUuid": form_uuid,
        "formDataJson": options["data_json"],
    }
    if options.get("dept_id"):
        params["deptId"] = options["dept_id"]
    result = send_request(session["base_url"].rstrip("/"), session["cookies"], session["csrf_token"], app_type, f"/dingtalk/web/{app_type}/v1/form/saveFormData.json", method="POST", params=params)
    print_result(result)


def update_form(positionals, options, session):
    require_positionals(positionals, 1, ["appType"])
    require_option(options, "inst_id")
    require_option(options, "data_json")
    app_type = positionals[0]
    params = {
        "formInstId": options["inst_id"],
        "updateFormDataJson": options["data_json"],
    }
    if options.get("use_latest_version"):
        params["useLatestVersion"] = options["use_latest_version"]
    result = send_request(session["base_url"].rstrip("/"), session["cookies"], session["csrf_token"], app_type, f"/dingtalk/web/{app_type}/v1/form/updateFormData.json", method="POST", params=params)
    print_result(result)


def query_subform(positionals, options, session):
    require_positionals(positionals, 2, ["appType", "formUuid"])
    require_option(options, "inst_id")
    require_option(options, "table_field_id")
    clamp_page_size(options, default=10)
    app_type, form_uuid = positionals[0], positionals[1]
    params = {
        "formUuid": form_uuid,
        "formInstanceId": options["inst_id"],
        "tableFieldId": options["table_field_id"],
        "currentPage": str(options["page"]),
        "pageSize": str(options["size"]),
    }
    result = send_request(session["base_url"].rstrip("/"), session["cookies"], session["csrf_token"], app_type, f"/dingtalk/web/{app_type}/v1/form/listTableDataByFormInstIdAndTableId.json", params=params)
    print_result(result)


def query_process(positionals, options, session):
    require_positionals(positionals, 2, ["appType", "formUuid"])
    clamp_page_size(options, default=10)
    app_type, form_uuid = positionals[0], positionals[1]
    params = {
        "formUuid": form_uuid,
        "currentPage": str(options["page"]),
        "pageSize": str(options["size"]),
    }
    for key in [
        "search_json",
        "task_id",
        "instance_status",
        "approved_result",
        "originator_id",
        "create_from",
        "create_to",
        "modified_from",
        "modified_to",
    ]:
        if options.get(key):
            api_key = "searchFieldJson" if key == "search_json" else snake_to_camel(key)
            params[api_key] = options[key]
    path = f"/dingtalk/web/{app_type}/v1/process/getInstances.json"
    if options.get("ids_only"):
        path = f"/dingtalk/web/{app_type}/v1/process/getInstanceIds.json"
    result = send_request(session["base_url"].rstrip("/"), session["cookies"], session["csrf_token"], app_type, path, params=params)
    print_result(result)


def get_process(positionals, options, session):
    require_positionals(positionals, 1, ["appType"])
    require_option(options, "process_inst_id")
    app_type = positionals[0]
    params = {"processInstanceId": options["process_inst_id"]}
    result = send_request(session["base_url"].rstrip("/"), session["cookies"], session["csrf_token"], app_type, f"/dingtalk/web/{app_type}/v1/process/getInstanceById.json", params=params)
    print_result(result)


def create_process(positionals, options, session):
    require_positionals(positionals, 2, ["appType", "formUuid"])
    require_option(options, "process_code")
    require_option(options, "data_json")
    app_type, form_uuid = positionals[0], positionals[1]
    params = {
        "processCode": options["process_code"],
        "formUuid": form_uuid,
        "formDataJson": options["data_json"],
    }
    if options.get("dept_id"):
        params["deptId"] = options["dept_id"]
    result = send_request(session["base_url"].rstrip("/"), session["cookies"], session["csrf_token"], app_type, f"/dingtalk/web/{app_type}/v1/process/startInstance.json", method="POST", params=params)
    print_result(result)


def update_process(positionals, options, session):
    require_positionals(positionals, 1, ["appType"])
    require_option(options, "process_inst_id")
    require_option(options, "data_json")
    app_type = positionals[0]
    params = {
        "processInstanceId": options["process_inst_id"],
        "updateFormDataJson": options["data_json"],
    }
    result = send_request(session["base_url"].rstrip("/"), session["cookies"], session["csrf_token"], app_type, f"/dingtalk/web/{app_type}/v1/process/updateInstance.json", method="POST", params=params)
    print_result(result)


def query_operation_records(positionals, options, session):
    require_positionals(positionals, 1, ["appType"])
    require_option(options, "process_inst_id")
    app_type = positionals[0]
    params = {"processInstanceId": options["process_inst_id"]}
    result = send_request(session["base_url"].rstrip("/"), session["cookies"], session["csrf_token"], app_type, f"/dingtalk/web/{app_type}/v1/process/getOperationRecords.json", params=params)
    print_result(result)


def execute_task(positionals, options, session):
    require_positionals(positionals, 1, ["appType"])
    for key in ["task_id", "process_inst_id", "out_result", "remark"]:
        require_option(options, key)
    app_type = positionals[0]
    params = {
        "taskId": options["task_id"],
        "procInstId": options["process_inst_id"],
        "outResult": options["out_result"],
        "remark": options["remark"],
    }
    if options.get("data_json"):
        params["formDataJson"] = options["data_json"]
    if options.get("no_execute_expressions"):
        params["noExecuteExpressions"] = options["no_execute_expressions"]
    result = send_request(session["base_url"].rstrip("/"), session["cookies"], session["csrf_token"], app_type, f"/dingtalk/web/{app_type}/v1/task/executeTask.json", method="POST", params=params)
    print_result(result)


def query_tasks(positionals, options, session):
    require_positionals(positionals, 1, ["appType"])
    require_option(options, "type")
    clamp_page_size(options, default=10)
    app_type = positionals[0]
    type_map = {
        "todo": "task/getTodoTasksInApp",
        "done": "task/getDoneTasksInApp",
        "submitted": "process/getMySubmitInApp",
        "cc": "task/getNotifyMeTasksInApp",
    }
    endpoint = type_map.get(options["type"])
    if not endpoint:
        parse_error("--type 仅支持 todo|done|submitted|cc")

    params = {
        "currentPage": str(options["page"]),
        "pageSize": str(options["size"]),
    }
    if options.get("keyword"):
        params["keyword"] = options["keyword"]
    if options.get("process_codes"):
        params["processCodes"] = options["process_codes"]
    if options.get("instance_status"):
        params["instanceStatus"] = options["instance_status"]

    result = send_request(session["base_url"].rstrip("/"), session["cookies"], session["csrf_token"], app_type, f"/dingtalk/web/{app_type}/v1/{endpoint}.json", params=params)
    print_result(result)


def snake_to_camel(value):
    parts = value.split("_")
    return parts[0] + "".join(part[:1].upper() + part[1:] for part in parts[1:])


def main():
    args = sys.argv[1:]
    if len(args) < 2:
        parse_error("缺少必填参数 action 或 resource")

    action = args[0]
    resource = args[1]
    positionals, options = parse_cli_options(args[2:])
    session = ensure_login()

    if action == "query" and resource == "form":
        query_form(positionals, options, session)
    elif action == "get" and resource == "form":
        get_form(positionals, options, session)
    elif action == "create" and resource == "form":
        create_form(positionals, options, session)
    elif action == "update" and resource == "form":
        update_form(positionals, options, session)
    elif action == "query" and resource == "subform":
        query_subform(positionals, options, session)
    elif action == "query" and resource == "process":
        query_process(positionals, options, session)
    elif action == "get" and resource == "process":
        get_process(positionals, options, session)
    elif action == "create" and resource == "process":
        create_process(positionals, options, session)
    elif action == "update" and resource == "process":
        update_process(positionals, options, session)
    elif action == "query" and resource == "operation-records":
        query_operation_records(positionals, options, session)
    elif action == "execute" and resource == "task":
        execute_task(positionals, options, session)
    elif action == "query" and resource == "tasks":
        query_tasks(positionals, options, session)
    else:
        fail(f"暂未实现的命令：{action} {resource}")


if __name__ == "__main__":
    main()
