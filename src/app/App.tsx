import { lazy } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { AppLayout } from '@/app/layouts/AppLayout';
import { NotFoundPage } from '@/pages/NotFoundPage';

// Each page is its own chunk, loaded when the route is first opened
const VocabPage = lazy(() => import('@/pages/VocabPage').then((m) => ({ default: m.VocabPage })));
const ExamPage = lazy(() => import('@/pages/ExamPage').then((m) => ({ default: m.ExamPage })));
const QuizPage = lazy(() => import('@/pages/QuizPage').then((m) => ({ default: m.QuizPage })));

export function App() {
  return (
    // "user" makes every Motion animation follow the visitor's reduced-motion setting
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<VocabPage />} />
            <Route path="exam" element={<ExamPage />} />
            <Route path="quiz" element={<QuizPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </MotionConfig>
  );
}
