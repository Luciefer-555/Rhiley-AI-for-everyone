import type React from "react"
import { User } from "lucide-react"
const AvatarPlaceholder: React.FC = () => {
  return (
    <div className="w-20 h-20 rounded-full bg-[#f0f3fa] flex items-center justify-center mb-8 shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff]">
      <User className="w-8 h-8" style={{ color: "#ff1493" }} />
    </div>
  )
}
export default AvatarPlaceholder
