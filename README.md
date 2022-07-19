TypeScript Webpack Near connect MyNearWallet Demo
=================================

Near官方提供了漂亮的UI，只需要集成，不过还是挺麻烦的

注意：
1. 由于使用到了node里的一些库，需要在webpack config中进行fallback，还要安装 `npm i buffer process`等，具体参考：
   1. https://stackoverflow.com/a/68723223/342235
   2. https://github.com/microsoft/PowerBI-visuals-tools/issues/365#issuecomment-875479827
2. png图片的处理
3. 上面两个问题在vite中无法正确处理，所以目前只能在webpack下构建

```
npm install
npm start
```

It will open page on browser automatically.
