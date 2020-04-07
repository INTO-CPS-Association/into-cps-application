//Added to avoid typescript error. See https://stackoverflow.com/a/35074833/1308616
declare module NodeJS  {
    interface Global {
        intoCpsApp: any
    }
}