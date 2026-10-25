import {
  createPrompt,
  isDownKey,
  isEnterKey,
  isUpKey,
  makeTheme,
  useKeypress,
  usePagination,
  usePrefix,
  useState,
} from "@inquirer/core"
import pc from "picocolors"

export const BACK = Symbol("back")

export interface MenuChoice<T extends string> {
  name: string
  value: T
}

interface MenuConfig {
  message: string
  choices: MenuChoice<string>[]
  canGoBack: boolean
}

const HIDE_CURSOR = "\u001B[?25l"

/** ↑↓ move, Enter selects, ← goes back (when allowed). Collapses to one line when answered. */
export const menuPrompt = createPrompt<string | typeof BACK, MenuConfig>((config, done) => {
  const theme = makeTheme({ prefix: { idle: "", done: "" } })
  const [status, setStatus] = useState<"idle" | "done">("idle")
  const [active, setActive] = useState(0)
  const [summary, setSummary] = useState("")
  const prefix = usePrefix({ status, theme })
  const { choices } = config

  useKeypress((key, rl) => {
    rl.clearLine(0) // keep the readline buffer empty: typed characters mean nothing here

    if (isEnterKey(key)) {
      const choice = choices[active]
      if (!choice) return
      setSummary(theme.style.answer(choice.name))
      setStatus("done")
      done(choice.value)
    } else if (key.name === "left" && config.canGoBack) {
      setSummary(pc.dim("← back"))
      setStatus("done")
      done(BACK)
    } else if ((isUpKey(key) || isDownKey(key)) && choices.length > 0) {
      const offset = isUpKey(key) ? -1 : 1
      setActive((active + offset + choices.length) % choices.length)
    }
  })

  // Hooks must run in the same order on every render, so this comes before the early return.
  const page = usePagination({
    items: choices,
    active,
    renderItem: ({ item, isActive }) =>
      isActive ? theme.style.highlight(`❯ ${item.name}`) : `  ${item.name}`,
    pageSize: 7,
    loop: true,
  })

  // An empty message means "no title line" (the caller already printed the context).
  const message = config.message ? theme.style.message(config.message, status) : ""

  if (status === "done") return [prefix, message, summary].filter(Boolean).join(" ")

  const keys = [
    `${pc.bold("↑↓")} ${pc.dim("navigate")}`,
    `${pc.bold("⏎")} ${pc.dim("select")}`,
    ...(config.canGoBack ? [`${pc.bold("←")} ${pc.dim("back")}`] : []),
  ]
  const help = keys.join(pc.dim(" • "))

  const title = [prefix, message].filter(Boolean).join(" ")
  return `${[title, page, help].filter(Boolean).join("\n")}${HIDE_CURSOR}`
})
