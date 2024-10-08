import { fromEvent, Observable, filter } from "rxjs";

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
  /**
   * 初始化函数
   */
  init?: () => void;
}

export class ChainOfResponsibility {
  handlers: ChainHandler[];
  constructor() {
    this.handlers = [];
  }

  add(handler: ChainHandler) {
    this.handlers.push(handler);
    handler.init?.();
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
          console.log(
            `通过接口请求，触发了脚本: ${params.path} ===> ${handler.name}`
          );
          task(params.responseJSON);
        }
      }
    }
  }
}

/**
 * 请求用户信息的接口触发太早，拦截不到 ~~
 * @returns
 */
export const getUserInfo = (() => {
  let promise: Promise<{
    name: string;
    identifier: string;
  }>;
  return async () => {
    if (promise) {
      return promise;
    }
    promise = fetch(`https://devops.aliyun.com/uiless/api/sdk/users/me`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((res) => {
        return {
          name: res.result.user.name,
          identifier: res.result.user.id,
        };
      });
    return promise;
  };
})();

// export 导出的原始类型，也会保持引用关系
export let isCheat = false;
export const initKeyBind = () => {
  const konami$: string[] = [];
  const sub = (fromEvent(document, "keydown") as Observable<KeyboardEvent>)
    .pipe(
      filter((e) => {
        konami$.push(e.key.toLocaleLowerCase());
        if (konami$.length > 10) {
          konami$.shift();
        }
        return (
          konami$.join("") ===
          "arrowuparrowuparrowdownarrowdownarrowleftarrowrightarrowleftarrowrightba"
        );
      })
    )
    .subscribe(() => {
      isCheat = true;
      sub.unsubscribe();
    });
};

interface Member {
  name: string;
  pinyin: string;
  _userId: string;
}

export const getAllMembers = (() => {
  let allMembers: Promise<Member[]>;

  return async () => {
    if (allMembers) {
      return allMembers;
    }
    allMembers = fetch(
      "https://devops.aliyun.com/projex/api/workspace/space/recommend/member/list?pageSize=100&withDeletedAndDisabled=false",
      {
        credentials: "include",
      }
    )
      .then((res) => res.json())
      .then((res) => res.result);
    return allMembers;
  };
})();
