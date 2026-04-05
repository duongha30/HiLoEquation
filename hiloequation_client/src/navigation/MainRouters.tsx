import { Home, Room } from '@/screens';
import { Routes, Route } from "react-router";

export default function MainRouters() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/room/:roomId" element={<Room />} />
    </Routes>
  )
}
