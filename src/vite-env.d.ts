/// <reference types="vite/client" />

// CSS 模块声明
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// 图片资源声明
declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
