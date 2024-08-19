import dayjs from "dayjs";
import { ChainHandler, getUserInfo } from "../utils";
import style from "../style.module.css";

const workClassName = style["working-hours-tips"];

interface WorkingHour {
  date: number;
  dateStr: string;
  actualWorkTime: number;
}

async function getWorkingHours() {
  const { identifier } = await getUserInfo();
  const endTime = dayjs().format("YYYY-MM-DD");
  const startTime = dayjs().startOf("month").format("YYYY-MM-DD");
  return fetch(
    "https://devops.aliyun.com/metric/api/card/work-time/distribution-detail",
    {
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        projectIds: "",
        userIds: identifier,
        startTime,
        endTime,
        tab: "time",
        pluginSourceProject: "projex",
        pluginType: "workTime",
        templateId: "",
        projectGroupIds: null,
        toPage: 1,
        pageSize: 40,
        keyWord: "",
        order: "desc",
        showCopyAndDownloadButton: false,
        sort: "",
        timeUsage: "arranged",
        types: "1,2,3",
        groupColumns: "default",
      }),
      method: "POST",
      mode: "cors",
      credentials: "include",
    }
  )
    .then((res) => res.json())
    .then((res) => {
      return res.result.content.map((e: WorkingHour) => ({
        ...e,
        dateStr: dayjs(e.date).format("YYYY-MM-DD"),
      })) as WorkingHour[];
    });
}

async function updateWorkingHours() {
  const list = await getWorkingHours();
  let div = document.querySelector(`.${workClassName}`) as HTMLDivElement;
  if (!div) {
    div = document.createElement("div");
    div.classList.add(workClassName);
    div.addEventListener("click", async () => {
      await updateWorkingHours();
      window.alert("更新成功");
    });
    document.querySelector(".system-bar-middle")?.appendChild(div);
  }
  const todayWorkHours = list[list.length - 1]?.actualWorkTime || 0;
  const monthWorkHours = list.reduce((acc, cur) => acc + cur.actualWorkTime, 0);
  div.classList.add(workClassName);
  div.textContent = `[有几分钟延迟]今天工时: ${todayWorkHours} 小时, 这个月已累计: ${monthWorkHours} 小时（${
    monthWorkHours / 4
  }个任务）`;
}

const init = () => {
  updateWorkingHours();
};

const match: ChainHandler["match"] = (path: string) => {
  return (
    // 工作项视图
    /^\/projex\/workitem/.test(path) ||
    // 工作台视图
    /^\/projex\/project/.test(path)
  );
};

const apiMaps: ChainHandler["apiMaps"] = new Map([
  [
    "/projex/api/workitem/workitem/time",
    () => {
      // 不是实时的，没有意义，找新接口
      // updateWorkingHours();
    },
  ],
]);

const name: ChainHandler["name"] = "工时统计";

export default {
  match,
  apiMaps,
  name,
  init,
} satisfies ChainHandler;
