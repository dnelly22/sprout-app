import {
  Apple, ArrowLeft, ArrowRight, ArrowUp, Award, Ban, Bell, BellRing, Bookmark, BookOpen, BookmarkPlus, Brain,
  CalendarCheck, CalendarHeart, Check, ChevronDown, ChevronRight, Circle, CircleHelp, Clock, Compass, Crown,
  Delete, Eye, EyeOff, Flame, Footprints, Gamepad2, Globe, Hand, Heart, House, Info, Leaf, LifeBuoy, Lightbulb,
  Link, ListChecks, Lock, Mail, Map, Megaphone, MessageCircle, MessagesSquare, Mic, Music, Play, Quote,
  RotateCcw, Search, SearchX, Settings, Shield, ShieldCheck, Smile, Sparkles, Sprout, Star, Target, Trash2,
  TrendingUp, Trophy, User, UserCog, Users, Volume2, VolumeX, Wrench, X, Zap,
  type LucideProps,
} from 'lucide-react';

/**
 * Curated icon registry. Only the icons used in the app are imported by name so
 * the Lucide tree shakes (a namespace `import *` would bundle the whole set).
 * Add new icons here as they're needed.
 */
const REGISTRY: Record<string, React.ComponentType<LucideProps>> = {
  'arrow-left': ArrowLeft, 'arrow-right': ArrowRight, 'arrow-up': ArrowUp, ban: Ban, bell: Bell,
  bookmark: Bookmark, 'book-open': BookOpen, 'bookmark-plus': BookmarkPlus, brain: Brain, 'calendar-check': CalendarCheck,
  check: Check, 'chevron-down': ChevronDown, 'chevron-right': ChevronRight, 'circle-help': CircleHelp, clock: Clock, link: Link,
  compass: Compass, crown: Crown, delete: Delete, eye: Eye, 'eye-off': EyeOff, flame: Flame,
  footprints: Footprints, 'gamepad-2': Gamepad2, globe: Globe, hand: Hand, heart: Heart, house: House,
  info: Info, leaf: Leaf, 'life-buoy': LifeBuoy, lightbulb: Lightbulb, lock: Lock, mail: Mail, map: Map,
  megaphone: Megaphone, 'message-circle': MessageCircle, mic: Mic, play: Play, quote: Quote,
  'rotate-ccw': RotateCcw, search: Search, 'search-x': SearchX, settings: Settings, shield: Shield,
  'shield-check': ShieldCheck, smile: Smile, sparkles: Sparkles, sprout: Sprout, star: Star,
  target: Target, 'trash-2': Trash2, 'trending-up': TrendingUp, trophy: Trophy, user: User,
  'user-cog': UserCog, users: Users, music: Music, 'volume-2': Volume2, 'volume-x': VolumeX, wrench: Wrench, x: X, zap: Zap,
  apple: Apple, award: Award, 'bell-ring': BellRing, 'calendar-heart': CalendarHeart, 'list-checks': ListChecks,
  'messages-square': MessagesSquare,
};

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  /** Fill color for a solid icon (e.g. filled stars). Lucide default is outline-only. */
  fill?: string;
}

export function Icon({ name, size = 22, color = 'currentColor', strokeWidth = 2, className, fill = 'none' }: IconProps) {
  const Cmp = REGISTRY[name] ?? Circle;
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} className={className} fill={fill} aria-hidden />;
}
