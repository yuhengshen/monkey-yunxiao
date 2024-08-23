import taskHandler from "./pages/task";
import workingHours from "./pages/workingHours";
import { ChainOfResponsibility, initKeyBind } from "./utils";

const chain = new ChainOfResponsibility();

chain.add(taskHandler).add(workingHours);

const xhrOpen = window.XMLHttpRequest.prototype.open;
window.XMLHttpRequest.prototype.open = function (...args: any) {
  xhrOpen.apply(this, args);
  let triggerURLPath = location.pathname;
  this.addEventListener("readystatechange", function () {
    if (this.readyState === 4 && this.status === 200) {
      const path = new URL(this.responseURL).pathname;
      const responseJSON =
        this.responseType === "json"
          ? this.response
          : JSON.parse(this.responseText);
      chain.handleApi({
        path,
        responseJSON,
        triggerURLPath,
      });
    }
  });
};

initKeyBind();
