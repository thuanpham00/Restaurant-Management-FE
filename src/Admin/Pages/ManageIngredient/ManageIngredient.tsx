import { useState } from "react"
import { Tabs } from "antd"
import { Helmet } from "react-helmet-async"
import { Package, FolderTree } from "lucide-react"
import NavigateBack from "src/Admin/Components/NavigateBack"
import IngredientListTab from "./components/IngredientListTab"
import IngredientCategoryListTab from "./components/IngredientCategoryListTab"

const { TabPane } = Tabs

export default function ManageIngredient() {
  const [activeTab, setActiveTab] = useState("ingredients")

  return (
    <div>
      <Helmet>
        <title>Quản lý nguyên liệu</title>
        <meta name="description" content="Quản lý nguyên liệu và danh mục nguyên liệu" />
      </Helmet>

      <NavigateBack />

      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600 my-2">
        Quản lý nguyên liệu
      </h1>

      <Tabs activeKey={activeTab} onChange={setActiveTab} className="mt-4">
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <Package size={18} />
              Nguyên liệu
            </span>
          }
          key="ingredients"
        >
          <IngredientListTab />
        </TabPane>

        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <FolderTree size={18} />
              Danh mục nguyên liệu
            </span>
          }
          key="categories"
        >
          <IngredientCategoryListTab />
        </TabPane>
      </Tabs>
    </div>
  )
}
