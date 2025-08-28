import { Cookie, getSetCookies } from "jsr:@std/http";
import "jsr:@std/dotenv/load";
const url = "https://192.168.16.49/rest/v10.16/";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const username = Deno.env.get("USERNAME");
  const password = Deno.env.get("PASSWORD");
  if (!username || !password) {
    throw new Error("USERNAME and PASSWORD envirenment variables required");
  }
  const cookies = await login(username, password);
  setVlan();
  await logout(cookies);
}

async function login(username: string, password: string) {
  const loginUrl = url + "login";
  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);
  const req = new Request(loginUrl, {
    method: "POST",
    body: formData,
  });

  const res = await fetch(req);
  console.log(res);
  const headers = res.headers;
  const cookies = getSetCookies(headers);
  return cookies;
  // const cookies = headers.getSetCookie().map((cookie) => {
  //   return cookie.split("; ")[0];
  // });
  // return cookies;
}

async function logout(cookies: Cookie[]) {
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
  console.log(res);
}

async function setVlan() {
}
