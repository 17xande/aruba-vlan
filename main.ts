import { parseArgs } from "jsr:@std/cli/parse-args";
import "jsr:@std/dotenv/load";
import { ArubaSwitch } from "./aruba.ts";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: ["--ip", "--port", "--username", "--password"],
  });
  const username = <string> args.username || Deno.env.get("USERNAME");
  const password = <string> args.password || Deno.env.get("PASSWORD");
  // TODO: Change these checks to asserts?
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

  const aruba = new ArubaSwitch(username, password, ip);

  try {
    await aruba.login();
    let vlan = await aruba.getVlan(port);
    if (vlan == 204) {
      vlan = 201;
    } else {
      vlan = 204;
    }

    await aruba.setVlan(port, vlan);
  } catch (err) {
    console.error(err);
  } finally {
    await aruba.logout();
  }
}
