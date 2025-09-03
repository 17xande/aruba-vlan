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
  const ip = <string> args.ip || Deno.env.get("IP");
  const port = <string> args.port || Deno.env.get("PORT");
  if (!ip || !port) {
    throw new Error("--ip, --port and are required");
  }
  const vlan = <number> args.vlan;

  const url = `https://${ip}/rest/v10.16/`;
  const cookies = await login(url, username, password);
  try {
    const vlan = getVlan(url, cookies, port);
    // setVlan(url, cookies, port, vlan);
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
  const headers = res.headers;
  const cookies = getSetCookies(headers);
  if (!res.ok) {
    console.log("res not ok");
    console.log(res);
  }
  console.log("logged in successfully");
  return cookies;
}

async function logout(url: string, cookies: Cookie[]) {
  const logoutUrl = url + "logout";
  const headers = new Headers();
  for (const cookie of cookies) {
    headers.set("Cookie", `${cookie.name}=${cookie.value}`);
  }
  const req = new Request(logoutUrl, {
    method: "POST",
    headers: headers,
  });

  const res = await fetch(req);
  if (!res.ok) {
    console.log("res not OK:");
    console.log(res);
  }
  console.log("logged out successfully");
}

async function getVlan(
  url: string,
  cookies: Cookie[],
  port: string,
): Promise<number> {
  const vlanUrl = `${url}system/interfaces/${encodeURIComponent(port)}`;
  const headers = new Headers();
  for (const cookie of cookies) {
    headers.set("Cookie", `${cookie.name}=${cookie.value}`);
  }

  const req = new Request(vlanUrl, {
    method: "GET",
    headers: headers,
  });

  const res = await fetch(req);
  if (!res.ok) {
    console.log("res not OK:");
    console.log(res);
  }

  const data = await res.json();
  const [vlan, _] = Object.entries(data.applied_vlan_tag)[0];
  console.log("got vlan:");
  console.log(vlan);
  return parseInt(vlan, 10);
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
    vlan_mode: "access",
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
  if (!res.ok) {
    console.log("res not OK");
    console.log(res);
    return;
  }
  console.log("set vlan successfully?");
}
