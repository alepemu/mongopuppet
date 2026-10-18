import { isCancel, log, select } from "@clack/prompts";

type Action = "backup" | "purge" | "restore" | "settings" | "exit";

const handlers: Record<Exclude<Action, "exit">, () => Promise<void>> = {
  backup: notImplemented("Backup"),
  purge: notImplemented("Purge"),
  restore: notImplemented("Restore"),
  settings: notImplemented("Settings"),
};

export async function runMenu(): Promise<void> {
  while (true) {
    const action = await select<Action>({
      message: "What do you want to do?",
      options: [
        { value: "backup", label: "Backup" },
        { value: "purge", label: "Purge" },
        { value: "restore", label: "Restore" },
        { value: "settings", label: "Settings" },
        { value: "exit", label: "Exit" },
      ],
    });

    if (isCancel(action) || action === "exit") return;
    await handlers[action]();
  }
}

function notImplemented(name: string) {
  return async () => {
    log.warn(`${name} is not implemented yet.`);
  };
}
