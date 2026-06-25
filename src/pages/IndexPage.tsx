import { stories } from '../data/stories';
import StoryCard from '../components/StoryCard';

export default function IndexPage() {
  return (
    <div className="index-page">
      <header className="site-header">
        <p className="site-header__eyebrow">A Collection of Timeless Wisdom</p>
        <h1 className="site-header__title">Fable &amp; Reflection</h1>
        <p className="site-header__tagline">
          Ancient stories. Modern meaning. Lifelong lessons.
        </p>
      </header>

      <main className="index-main">
        <p className="index-main__label">{stories.length} stories</p>
        <div className="story-grid">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      </main>

      <footer className="site-footer">
        Fable &amp; Reflection &nbsp;·&nbsp; Ancient wisdom for modern lives
      </footer>
    </div>
  );
}
