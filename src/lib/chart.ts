import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Title,
  Tooltip
} from "chart.js"
import ChartDataLabels from "chartjs-plugin-datalabels"

let isRegistered = false

export const registerCharts = () => {
  if (isRegistered) {
    return
  }

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    TimeScale,
    Tooltip,
    Legend,
    Title,
    Filler,
    ChartDataLabels
  )

  isRegistered = true
}
