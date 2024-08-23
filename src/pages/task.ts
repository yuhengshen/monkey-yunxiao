import { ApiHandler, ChainHandler, getUserInfo } from "../utils";
import style from "../style.module.css";
import { timer, interval, takeUntil, map, first, mergeMap, from } from "rxjs";
import yunxiao from "../assets/yunxiao.svg";

const match = (path: string) => {
  return (
    // 任务视图
    /^\/projex\/project\/.+\/task/.test(path) ||
    // 工作项视图
    /^\/projex\/workitem/.test(path) ||
    // 工作台视图
    /^\/workbench$/.test(path)
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
            let dom = document.querySelector(
              "#AONE_MY_WORKITEM_CARD .next-table-inner"
            ) as HTMLElement;
            let col: number | undefined = 1;
            if (dom) {
              return {
                dom,
                col,
              };
            }
            dom = document.querySelector(
              ".workitemListMainAreaWrap .next-table-inner"
            ) as HTMLElement;
            if (dom) {
              col = findColsNum(dom, "状态");
              return {
                dom,
                col,
              };
            }
            return undefined;
          }),
          first((data) => !!data),
          takeUntil(timer(500))
        )
        .subscribe({
          next: ({ dom: target, col }) => {
            // 可能通过侧边栏触发接口，但是无法判断触发来源
            if (target.getAttribute("init-progress")) {
              console.log("已经初始化过了");
              return;
            }
            target.setAttribute("init-progress", "true");
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
function findColsNum(target: HTMLElement, title: string): number | undefined {
  const thList = target.querySelectorAll<HTMLTableCaptionElement>(
    ".next-table-header th"
  );
  for (let i = 0; i < thList.length; i++) {
    if (thList[i].innerText === title) {
      return i;
    }
  }
  return undefined;
}

interface NotCompletedTask {
  subject: string;
  identifier: string;
  spaceIdentifier: string;
  parentIdentifier: string;
}
let notCompletedTaskMap = new Map<string, NotCompletedTask>();

async function queryOtherTaskProgress(
  parentIdentifier: string,
  { identifier }: any
) {
  const res = await fetch(
    `https://devops.aliyun.com/projex/api/workitem/v2/workitem/${parentIdentifier}/relation/workitem/list/by-relation-category?category=PARENT_SUB&isForward=true&_input_charset=utf-8`,
    {
      headers: {
        "Content-Type": "application/json",
      },
      method: "GET",
      credentials: "include",
    }
  ).then((res) => res.json());

  if (res.code !== 200) {
    return 0;
  }

  // 获取全部任务列表，且不数据当前子任务
  const taskList = res.result
    ?.filter((item: any) => item.workitemTypeName === "任务")
    .filter((item: any) => item.identifier !== identifier);

  if (!taskList?.length) {
    return 100;
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

  return (completed / progress) * 100;
}

async function queryParentAndUpdateEl(
  parentIdentifier: string,
  dom: HTMLDivElement,
  dataItem: any
) {
  const progress = await queryOtherTaskProgress(parentIdentifier, {
    identifier: dataItem.identifier,
  });
  dom.style.width = `${progress}%`;
  const userInfo = await getUserInfo();
  const userId = userInfo.identifier;
  if (userId === dataItem.assignedTo.identifier) {
    if (progress === 100) {
      notCompletedTaskMap.delete(dataItem.identifier);
    } else {
      if (!notCompletedTaskMap.has(dataItem.identifier)) {
        notCompletedTaskMap.set(dataItem.identifier, {
          subject: dataItem.subject,
          identifier: dataItem.identifier,
          spaceIdentifier: dataItem.spaceIdentifier,
          parentIdentifier,
        });
      }
    }
  }
}

async function notificationTask([
  identifier,
  { subject, parentIdentifier, spaceIdentifier },
]: [string, NotCompletedTask]) {
  try {
    const progress = await queryOtherTaskProgress(parentIdentifier, {
      identifier,
    });
    if (progress === 100) {
      notCompletedTaskMap.delete(identifier);
      new Notification("其他任务进度已完成", {
        body: `任务：${subject} 的其他任务已完成，点击查看需求详情`,
        icon: yunxiao,
        requireInteraction: true,
      }).addEventListener("click", () => {
        window.open(
          `https://devops.aliyun.com/projex/project/${spaceIdentifier}/req/${parentIdentifier}`
        );
      });
    }
  } catch (e: any) {
    console.error("查询任务进度失败");
  }
}

/**
 * 对于未完成的任务，每隔一段时间查询一次进度，如果进度为100%，则发送通知
 */
interval(1000 * 60 * 10)
  .pipe(
    mergeMap(() =>
      from([...notCompletedTaskMap.entries()]).pipe(
        mergeMap(notificationTask, 5)
      )
    )
  )
  .subscribe();

const name = "任务进度条";

export default {
  match,
  apiMaps,
  name,
} as ChainHandler;
