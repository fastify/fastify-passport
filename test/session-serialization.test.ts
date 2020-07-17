import Authenticator from "../src/Authenticator";

describe("Authenticator session serialization", () => {
  test("it should roundtrip a user", async () => {
    const fastifyPassport = new Authenticator();

    fastifyPassport.registerUserSerializer(async (user) => JSON.stringify(user));
    fastifyPassport.registerUserDeserializer(async (serialized: string) => JSON.parse(serialized));

    const user = { name: "foobar" };
    const request = {} as any;
    expect(await fastifyPassport.deserializeUser(await fastifyPassport.serializeUser(user, request), request)).toEqual(
      user
    );
  });
});
