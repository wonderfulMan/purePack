declare module "*.tpl" {
  const src: string;
  export default src;
}
declare module "juicer" {
  const juicer: Function

  export = juicer
}