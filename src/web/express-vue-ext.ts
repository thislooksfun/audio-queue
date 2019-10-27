// @ts-ignore
import * as core from "express-serve-static-core";
// @ts-ignore
import * as expressVue from "express-vue";

interface ConfigObjectType {
  cacheOptions?: { max: number; maxAge: number };
  pagesPath?: string;
  vueVersion?: string;
  head?: object;
  data?: object;
  // webpack: { server: webpack.Configuration, client: webpack.Configuration }
  webpack?: { server: any; client: any };
  vue?: object;
  expressVueFolder?: string;

  rootPath?: string;
}

declare module "express-vue" {
  // @ts-ignore
  function use(expressApp: Object, options?: ConfigObjectType): Function;
}

declare module "express-serve-static-core" {
  interface Response {
    renderVue: (
      componentPath: string,
      data?: object,
      vueOptions?: object
    ) => void;
  }
}
