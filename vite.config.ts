import { defineConfig } from "vite";
import monkey, { cdn } from "vite-plugin-monkey";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: "src/main.ts",
      userscript: {
        icon: "data:image/svg+xml,%3Csvg%20width%3D%22240%22%20height%3D%22240%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cdefs%3E%3ClinearGradient%20x1%3D%2250.007%25%22%20y1%3D%2299.839%25%22%20x2%3D%2250.007%25%22%20y2%3D%22.339%25%22%20id%3D%22a%22%3E%3Cstop%20stop-color%3D%22%23006ad4%22%20stop-opacity%3D%22.5%22%20offset%3D%220%25%22%2F%3E%3Cstop%20stop-color%3D%22%23006ad4%22%20stop-opacity%3D%22.2%22%20offset%3D%22100%25%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20x1%3D%2250.035%25%22%20y1%3D%22-.079%25%22%20x2%3D%2250.035%25%22%20y2%3D%2299.929%25%22%20id%3D%22b%22%3E%3Cstop%20stop-color%3D%22%23006ad4%22%20offset%3D%220%25%22%2F%3E%3Cstop%20stop-color%3D%22%23006ad4%22%20stop-opacity%3D%22.5%22%20offset%3D%22100%25%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Crect%20width%3D%22240%22%20height%3D%22240%22%20rx%3D%2212%22%2F%3E%3Cg%20transform%3D%22translate(24%2024)%22%20fill-rule%3D%22nonzero%22%3E%3Cpath%20d%3D%22m192%20191.774-67.621-89.901%2048.997-67.087-33.921-26.202-69.395%2093.74%2060.748%2080.64c4.213%205.648%2010.642%208.81%2017.737%208.81H192Z%22%20fill%3D%22url(%23a)%22%2F%3E%3Cellipse%20fill%3D%22%23006ad4%22%20cx%3D%22156.527%22%20cy%3D%2221.685%22%20rx%3D%2221.284%22%20ry%3D%2221.685%22%2F%3E%3Cpath%20d%3D%22M124.379%20101.873%2061.413%2018.296c-4.212-5.647-10.642-8.809-17.736-8.809H0l69.838%2092.838L3.77%20192h43.012c7.094%200%2013.524-3.388%2017.736-9.035l59.862-81.092Z%22%20fill%3D%22url(%23b)%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E",
        namespace: "npm/vite-plugin-monkey",
        match: [
          "https://devops.aliyun.com/projex/*",
          "https://devops.aliyun.com/workbench*",
        ],
        description: "云效脚本",
        license: "MIT",
        "run-at": "document-start",
      },
      build: {
        externalGlobals: {
          rxjs: cdn.bytecdntp("rxjs", "rxjs.umd.min.js"),
          dexie: cdn.bytecdntp("dexie", "dexie.min.js"),
          dayjs: cdn.bytecdntp("dayjs", "dayjs.min.js"),
        },
      },
    }),
  ],
});
