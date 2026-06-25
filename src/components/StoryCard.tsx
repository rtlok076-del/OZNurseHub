import { Link } from 'react-router-dom';
import type { Story } from '../types/story';

export default function StoryCard({ story }: { story: Story }) {
  return (
    <Link to={`/story/${story.slug}`} className="story-card">
      <span className="story-card__tag">{story.category}</span>
      <h2 className="story-card__title">{story.title}</h2>
      <p className="story-card__excerpt">{story.excerpt}</p>
      <div className="story-card__meta">
        <span className="story-card__read-time">{story.readTime} min read</span>
        <span className="story-card__read-link">Read →</span>
      </div>
    </Link>
  );
}
