import { BrowserRouter, Routes, Route } from 'react-router-dom';
import IndexPage from './pages/IndexPage';
import StoryPage from './pages/StoryPage';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/story/:slug" element={<StoryPage />} />
      </Routes>
    </BrowserRouter>
  );
}
