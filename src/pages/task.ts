import { ApiHandler, ChainHandler } from "../utils";
import style from "../style.module.css";
import { timer, interval, takeUntil, map, first } from "rxjs";

const match = (path: string) => {
  return (
    // 任务视图
    /\/projex\/project\/.+\/task/.test(path) ||
    // 工作项视图
    /\/projex\/workitem/.test(path)
  );
};

const apiMaps = new Map<string, ApiHandler>([
  [
    "/projex/api/workitem/workitem/list",
    (data) => {
      interval(100)
        .pipe(
          // 查询到元素存在后，停止轮询，并返回元素
          map(() => {
            return document.querySelector(
              ".workitemListMainAreaWrap .next-table-inner"
            ) as HTMLElement;
          }),
          first((el) => !!el),
          takeUntil(timer(500))
        )
        .subscribe({
          next: (target) => {
            // 可能通过侧边栏触发接口，但是无法判断触发来源
            if (target.getAttribute("init-progress")) {
              console.log("已经初始化过了");
              return;
            }
            target.setAttribute("init-progress", "true");
            const col = findColsNum(target, "状态");
            if (col) {
              const elList = target.querySelectorAll<HTMLTableCellElement>(
                `.next-table-body tr td[data-next-table-col="${col}"] button`
              );
              elList.forEach((el, i) => {
                const dataItem = data.result[i];
                if (dataItem.workitemType.name !== "任务") return;
                el.style.position = "relative";
                const div = document.createElement("div");
                div.classList.add(style["status-button-progress"]);
                el.appendChild(div);
                const parentIdentifier = dataItem?.parentIdentifier;
                parentIdentifier &&
                  queryParentAndUpdateEl(parentIdentifier, div, dataItem);
              });
            }
          },
        });
    },
  ],
]);

/**
 * 找到标题是第几列
 */
function findColsNum(target: HTMLElement, title: string): number | void {
  const thList = target.querySelectorAll<HTMLTableCaptionElement>(
    ".next-table-header th"
  );
  for (let i = 0; i < thList.length; i++) {
    if (thList[i].innerText === title) {
      return i;
    }
  }
}

async function queryParentAndUpdateEl(
  identifier: string,
  dom: HTMLDivElement,
  dataItem: any
) {
  const res = await fetch(
    `https://devops.aliyun.com/projex/api/workitem/v2/workitem/${identifier}/relation/workitem/list/by-relation-category?category=PARENT_SUB&isForward=true&_input_charset=utf-8`,
    {
      headers: {
        "Content-Type": "application/json",
      },
      method: "GET",
      credentials: "include",
    }
  ).then((res) => res.json());

  // 获取全部任务列表，且不数据当前子任务
  const taskList = res.result
    ?.filter((item: any) => item.workitemTypeName === "任务")
    .filter((item: any) => item.identifier !== dataItem.identifier);

  function setStyle(n: number) {
    dom.style.width = `${n}%`;
  }
  if (!taskList?.length) {
    setStyle(100);
    return;
  }

  const progress = taskList.length * 100;
  let completed = 0;

  taskList.forEach((task: any) => {
    const progressStr = task.fieldValueVOList.find(
      (field: any) => field.fieldIdentifier === "progress"
    )?.value;
    if (progressStr === "0.1") return;

    const n = Number(progressStr);
    if (n) {
      completed += n;
    }
  });

  const percent = (completed / progress) * 100;
  setStyle(percent);
}

const name = "任务进度条";

export default {
  match,
  apiMaps,
  name,
} as ChainHandler;
