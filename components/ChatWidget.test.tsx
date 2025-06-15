import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest'; // Import vi from Vitest

import ChatWidget from './ChatWidget';
import { ARTICLES_DATA, COURSES_DATA, FAQ_DATA, PREVIEW_SECTIONS, APP_NAME } from '../constants';

// --- Mocks ---

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useLocation: () => ({
    pathname: '/',
  }),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

// Mock useAuth context
const mockLogout = vi.fn(); // This can stay here as useAuth() returns it, and useAuth is mocked.
const mockUseAuth = vi.fn(() => ({
  session: null,
  user: null,
  profile: null,
  logout: mockLogout,
}));
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useDarkMode hook
const mockToggleDarkMode = vi.fn(); // Similar to mockLogout
const mockUseDarkMode = vi.fn(() => ({
  darkMode: false,
  toggleDarkMode: mockToggleDarkMode,
}));
vi.mock('../hooks/useDarkMode', () => ({
  useDarkMode: () => mockUseDarkMode(),
}));

// Mock useData context
const mockUseData = vi.fn(() => ({
  articles: ARTICLES_DATA,
  courses: COURSES_DATA,
  faqCategories: FAQ_DATA,
  siteSections: PREVIEW_SECTIONS,
}));
vi.mock('../contexts/DataContext', () => ({
  useData: () => mockUseData(),
}));

// Mock Supabase client
// The factory function is hoisted. It creates its own vi.fn instances.
vi.mock('../utils/supabaseClient', () => {
  const signInWithOAuth = vi.fn();
  const updateUser = vi.fn();
  const invoke = vi.fn();
  return {
    supabase: {
      auth: {
        signInWithOAuth: signInWithOAuth,
        updateUser: updateUser,
      },
      functions: {
        invoke: invoke,
      },
    },
  };
});

// Mock Modal Components
vi.mock('./auth/LoginModal', () => ({ default: () => <div data-testid="login-modal">Login Modal</div> }));
vi.mock('./auth/SignupModal', () => ({ default: () => <div data-testid="signup-modal">Signup Modal</div> }));
vi.mock('./auth/ForgotPasswordModal', () => ({ default: () => <div data-testid="forgot-password-modal">Forgot Password Modal</div> }));
vi.mock('../components/profile/ProfileModal', () => ({ default: () => <div data-testid="profile-modal">Profile Modal</div> }));


// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    Info: () => <div data-testid="info-icon" />,
    BookOpen: () => <div data-testid="bookopen-icon" />,
    Rss: () => <div data-testid="rss-icon" />,
    MessageSquare: () => <div data-testid="messagesquare-icon" />,
    Send: () => <div data-testid="send-icon" />,
  };
});

// Mock global fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text: 'Default AI response' }] } }] }),
  })
) as any;

// --- End Mocks ---

// Import the mocked supabase instance *after* vi.mock has been defined.
// Vitest ensures this import receives the mocked version.
let mockedSupabase: any; // To store the imported mock
beforeAll(async () => {
  mockedSupabase = (await import('../utils/supabaseClient')).supabase;
});


describe('ChatWidget Command Processing', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Clears all vi.fn() instances, including those inside mockedSupabase

    // Re-configure mocks for each test if necessary (e.g., for supabase calls)
    // For supabase, if they are cleared, they need to be re-mocked for resolved values etc.
    // Example: (mockedSupabase.auth.signInWithOAuth as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {}, error: null });
    // Or do this inside each test that needs a specific supabase response.

    mockUseAuth.mockImplementation(() => ({ // mockUseAuth is defined outside, so this is fine.
      session: null,
      user: null,
      profile: null,
      logout: mockLogout,
    }));

    mockUseDarkMode.mockImplementation(() => ({ // mockUseDarkMode is defined outside
      darkMode: false,
      toggleDarkMode: mockToggleDarkMode,
    }));

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text: 'Default AI response' }] } }] }),
      })
    ) as any;
  });

  const openChatAndSendMessage = async (message: string) => {
    render(<ChatWidget />);

    const chatButton = screen.getByText('צ\'אט');
    fireEvent.click(chatButton);

    const inputElement = screen.getByPlaceholderText('כתבו הודעה...');
    fireEvent.change(inputElement, { target: { value: message } });

    const sendButton = screen.getByText('שלח');
    fireEvent.click(sendButton);
  };

  it('should call toggleDarkMode when ACTION_TOGGLE_DARK_MODE is received', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text: 'ACTION_TOGGLE_DARK_MODE' }] } }] }),
      })
    ) as any;

    await openChatAndSendMessage('toggle dark mode');

    await waitFor(() => {
      expect(mockToggleDarkMode).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText('מצב כהה הופעל.')).toBeInTheDocument();
  });

  it('should call toggleDarkMode when ACTION_TOGGLE_DARK_MODE is received with extra text', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text: 'Okay, I will run ACTION_TOGGLE_DARK_MODE for you.' }] } }] }),
      })
    ) as any;

    await openChatAndSendMessage('please change the theme');

    await waitFor(() => {
      expect(mockToggleDarkMode).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText('מצב כהה הופעל.')).toBeInTheDocument();
  });

  it('should call logout when ACTION_USER_LOGOUT is received and user is logged in', async () => {
    mockUseAuth.mockImplementation(() => ({
      session: { user: { id: '123' } } as any,
      user: { id: '123', email: 'test@example.com' } as any,
      profile: { fullName: 'Test User' } as any,
      logout: mockLogout,
    }));

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text: 'ACTION_USER_LOGOUT' }] } }] }),
      })
    ) as any;

    await openChatAndSendMessage('log me out');

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText('התנתקת בהצלחה.')).toBeInTheDocument();
  });

  it('should call signInWithOAuth when ACTION_USER_LOGIN_GOOGLE is received', async () => {
    // Configure the mock from the imported mockedSupabase
    (mockedSupabase.auth.signInWithOAuth as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {}, error: null });

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text: 'ACTION_USER_LOGIN_GOOGLE' }] } }] }),
      })
    ) as any;

    await openChatAndSendMessage('login with google');

    await waitFor(() => {
      expect(mockedSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
    });
    expect(await screen.findByText('מפנה אותך להתחברות עם גוגל...')).toBeInTheDocument();
  });

  it('should open profile modal when ACTION_OPEN_PROFILE_MODAL is received and user is logged in', async () => {
    mockUseAuth.mockImplementation(() => ({
      session: { user: { id: '123' } } as any,
      user: { id: '123', email: 'test@example.com' } as any,
      profile: { fullName: 'Test User' } as any,
      logout: mockLogout,
    }));

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text: 'ACTION_OPEN_PROFILE_MODAL' }] } }] }),
      })
    ) as any;

    await openChatAndSendMessage('open my profile');

    await waitFor(() => {
      expect(screen.getByText('פותח את הגדרות הפרופיל שלך...')).toBeInTheDocument();
    });
    expect(screen.getByTestId('profile-modal')).toBeInTheDocument();
  });

  it('should call delete user function when ACTION_USER_DELETE_ACCOUNT_CONFIRMED is received and user is logged in', async () => {
    mockUseAuth.mockImplementation(() => ({
      session: { user: { id: '123' } } as any,
      user: { id: '123', email: 'test@example.com' } as any,
      profile: { fullName: 'Test User' } as any,
      logout: mockLogout,
    }));
    // Configure the mock from the imported mockedSupabase
    (mockedSupabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {}, error: null });

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text: 'ACTION_USER_DELETE_ACCOUNT_CONFIRMED' }] } }] }),
      })
    ) as any;

    await openChatAndSendMessage('yes delete my account');

    await waitFor(() => {
      expect(mockedSupabase.functions.invoke).toHaveBeenCalledWith('delete-user-account');
    });
    expect(await screen.findByText(/בקשת מחיקת החשבון שלך עובדה/)).toBeInTheDocument();
  });

  it('should display orders message when ACTION_USER_VIEW_ORDERS is received and user is logged in', async () => {
    mockUseAuth.mockImplementation(() => ({
      session: { user: { id: '123' } } as any,
      user: { id: '123', email: 'test@example.com' } as any,
      profile: { fullName: 'Test User' } as any,
      logout: mockLogout,
    }));

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text: 'ACTION_USER_VIEW_ORDERS' }] } }] }),
      })
    ) as any;

    await openChatAndSendMessage('show my orders');

    await waitFor(() => {
      expect(screen.getByText(/מאחזר את היסטוריית ההזמנות שלך/)).toBeInTheDocument();
    });
  });

  it('should tell user to log in for ACTION_OPEN_PROFILE_MODAL if logged out', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text: 'ACTION_OPEN_PROFILE_MODAL' }] } }] }),
      })
    ) as any;

    await openChatAndSendMessage('open my profile');

    await waitFor(() => {
      expect(screen.getByText('עליך להתחבר תחילה כדי לצפות או לעדכן את הפרופיל שלך.')).toBeInTheDocument();
    });
  });

});
