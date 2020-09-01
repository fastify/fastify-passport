import { getConfiguredTestServer, generateTestUser } from "./helpers";
import { Strategy } from "../src";

export class TestThirdPartyStrategy extends Strategy {
  authenticate(_request: any, _options?: { pauseStream?: boolean }) {
    return this.success(generateTestUser());
  }
}

describe(".authorize", () => {
  test(`should return 401 Unauthorized if not logged in`, async () => {
    const { server, fastifyPassport } = getConfiguredTestServer();
    fastifyPassport.use(new TestThirdPartyStrategy("third-party"));

    server.get("/", { preValidation: fastifyPassport.authorize("third-party") }, async (request) => {
      expect(request.user).toBeFalsy();
      expect(request.account.id).toBeTruthy();
      expect(request.account.name).toEqual("test");

      return "it worked";
    });

    const response = await server.inject({ method: "GET", url: "/" });
    expect(response.statusCode).toEqual(200);
  });
});
