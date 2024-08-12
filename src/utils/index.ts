export interface ApiHandler<T = any> {
  (data: T): void;
}

export interface ChainHandler {
  /**
   * 
   * @param url - location.pathname 是否匹配
   * @returns 
   */
  match: (path: string) => boolean;
  /**
   * key - 请求路径
   * value - 请求路径对应的处理函数
   */
  apiMaps: Map<string, ApiHandler>;
  /**
   * 名称
   */
  name?: string;
}

export class ChainOfResponsibility {
  handlers: ChainHandler[];
  constructor() {
    this.handlers = [];
  }

  add(handler: ChainHandler) {
    this.handlers.push(handler);
    return this;
  }

  handleApi(params: {
    path: string;
    responseJSON: any;
    triggerURLPath: string;
  }) {
    for (const handler of this.handlers) {
      if (handler.match(params.triggerURLPath)) {
        const task = handler.apiMaps.get(params.path);
        if (task) {
          console.log(`通过接口请求，触发了脚本: ${params.path} ===> ${handler.name}`);
          task(params.responseJSON);
        }
      }
    }
  }
}
