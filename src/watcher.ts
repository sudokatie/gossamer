import { watch as chokidarWatch, type FSWatcher } from "chokidar";

export function watch(
  inputDir: string,
  outputDir: string,
  onChange: (path: string, event: string) => void,
): FSWatcher {
  const watcher = chokidarWatch(inputDir, {
    ignored: [
      outputDir,
      /(^|[\/\\])\../,
      /node_modules/,
      /_site/,
    ],
    persistent: true,
    ignoreInitial: true,
  });
  
  let debounceTimeout: NodeJS.Timeout | null = null;
  let pendingPath: string | null = null;
  let pendingEvent: string | null = null;
  
  const triggerChange = () => {
    if (pendingPath && pendingEvent) {
      onChange(pendingPath, pendingEvent);
      pendingPath = null;
      pendingEvent = null;
    }
  };
  
  const handleChange = (event: string) => (filepath: string) => {
    pendingPath = filepath;
    pendingEvent = event;
    
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    debounceTimeout = setTimeout(triggerChange, 100);
  };
  
  watcher.on("change", handleChange("change"));
  watcher.on("add", handleChange("add"));
  watcher.on("unlink", handleChange("unlink"));
  
  return watcher;
}
