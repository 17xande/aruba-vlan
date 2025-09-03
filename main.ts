import { Cookie, getSetCookies } from "jsr:@std/http";
import { parseArgs } from "jsr:@std/cli/parse-args";
import "jsr:@std/dotenv/load";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: ["--ip", "--port", "--username", "--password"],
  });
  const username = <string> args.username || Deno.env.get("USERNAME");
  const password = <string> args.password || Deno.env.get("PASSWORD");
  if (!username || !password) {
    throw new Error(
      "Required to include --username and --password arguments, or USERNAME and PASSWORD envirenment variables",
    );
  }
  if (!args.ip || !args.port || !args.vlan) {
    throw new Error("--ip, --port and --vlan are required");
  }
  const port = <string> args.port;
  const vlan = <number> args.vlan;

  const url = `https://${args.ip}/rest/v10.16/`;
  const cookies = await login(url, username, password);
  try {
    setVlan(url, cookies, port, vlan);
  } catch (err) {
    console.error(err);
  } finally {
    await logout(url, cookies);
  }
}

async function login(url: string, username: string, password: string) {
  const loginUrl = url + "login";
  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);
  const req = new Request(loginUrl, {
    method: "POST",
    body: formData,
  });

  const res = await fetch(req);
  // console.log(res);
  const headers = res.headers;
  const cookies = getSetCookies(headers);
  return cookies;
}

async function logout(url: string, cookies: Cookie[]) {
  const logoutUrl = url + "logout";
  const headers = new Headers();
  for (const cookie of cookies) {
    headers.set("Cookie", `${cookie.name}=${cookie.value}`);
  }
  // headers.set("accept", "*/*");
  console.log("headers:");
  console.log(headers);
  const req = new Request(logoutUrl, {
    method: "POST",
    headers: headers,
  });

  const res = await fetch(req);
  // console.log(res);
}

async function setVlan(
  url: string,
  cookies: Cookie[],
  port: string,
  vlan: number,
) {
  const vlanUrl = `${url}system/interfaces/${encodeURIComponent(port)}`;
  const headers = new Headers();
  for (const cookie of cookies) {
    headers.set("Cookie", `${cookie.name}=${cookie.value}`);
  }
  headers.set("Content-Type", "application/json");
  const data = {
    vlan_mode: "native-untagged",
    vlan_tag: {
      [vlan]: `/rest/v10.16/system/vlans/${vlan}`,
    },
  };
  const req = new Request(vlanUrl, {
    method: "PATCH",
    headers: headers,
    body: JSON.stringify(data),
  });

  const res = await fetch(req);
  console.log(res);
}
