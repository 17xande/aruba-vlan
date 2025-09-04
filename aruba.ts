import { Cookie, getSetCookies } from "jsr:@std/http";

export class ArubaSwitch {
  cookies: Cookie[];
  username: string;
  password: string;
  ip: string;
  url: string;

  constructor(username: string, password: string, ip: string) {
    this.username = username;
    this.password = password;
    this.cookies = [];
    this.ip = ip;
    this.url = `https://${ip}/rest/v10.16/`;
  }

  getHeaders(): Headers {
    const headers = new Headers();
    for (const cookie of this.cookies) {
      headers.set("Cookie", `${cookie.name}=${cookie.value}`);
    }

    return headers;
  }

  async login(): Promise<boolean> {
    const loginUrl = this.url + "login";
    const formData = new FormData();
    formData.append("username", this.username);
    formData.append("password", this.password);
    const req = new Request(loginUrl, {
      method: "POST",
      body: formData,
    });

    const res = await fetch(req);
    const headers = res.headers;
    const cookies = getSetCookies(headers);
    if (!res.ok) {
      console.warn(res);
    }
    console.log("logged in successfully");
    this.cookies = cookies;
    return res.ok;
  }

  async logout(): Promise<boolean> {
    const logoutUrl = this.url + "logout";
    const req = new Request(logoutUrl, {
      method: "POST",
      headers: this.getHeaders(),
    });

    const res = await fetch(req);
    if (!res.ok) {
      console.warn(res);
    }
    console.log("logged out successfully");
    return res.ok;
  }

  async getVlan(
    port: string,
  ): Promise<number> {
    // TODO: include filter in url so only the active vlan is returned
    const vlanUrl = `${this.url}system/interfaces/${encodeURIComponent(port)}`;

    const req = new Request(vlanUrl, {
      method: "GET",
      headers: this.getHeaders(),
    });

    const res = await fetch(req);
    if (!res.ok) {
      console.warn(res);
    }

    const data = await res.json();
    const [vlan, _] = Object.entries(data.applied_vlan_tag)[0];
    console.log("got vlan:");
    console.log(vlan);
    return parseInt(vlan, 10);
  }

  async setVlan(
    port: string,
    vlan: number,
  ): Promise<boolean> {
    const vlanUrl = `${this.url}system/interfaces/${encodeURIComponent(port)}`;
    const headers = this.getHeaders();
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
      console.warn(res);
    }
    return res.ok;
  }
}
