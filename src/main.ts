import taskHandler from "./pages/task";
import { ChainOfResponsibility } from "./utils";

const chain = new ChainOfResponsibility();

chain.add(taskHandler);

const xhrOpen = window.XMLHttpRequest.prototype.open;
window.XMLHttpRequest.prototype.open = function (...args: any) {
  xhrOpen.apply(this, args);
  let triggerURLPath = location.pathname;
  this.addEventListener("readystatechange", function () {
    if (this.readyState === 4) {
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
