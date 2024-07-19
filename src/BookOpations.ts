// {
//     bookPath : null,
//     version: 1, // Changing will cause stored Book information to be reloaded
//     restore: false, // Skips parsing epub contents, loading from localstorage instead
//     storage: false, // true (auto) or false (none) | override: 'ram', 'websqldatabase', 'indexeddb', 'filesystem'
//     spreads: true, // Displays two columns
//     fixedLayout : false, //-- Will turn off pagination
//     styles : {}, // Styles to be applied to epub
//     width : false, //width和height可以设置图书内容的宽和高，默认值是不设置，此时会填满父窗口。
//     height: false, 
// }
export interface BookOptions {
    bookPath: string;
    version: number;
    restore: boolean;
    storage: boolean;
    spreads: boolean;
    fixedLayout: boolean;
    styles: any;
    width: boolean;
    height: boolean;
}
