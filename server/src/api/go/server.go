package suroimd_api

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"net/http"
	"sync"

	_ "github.com/mattn/go-sqlite3"
)

type ApiServer struct {
	accounts_db *sql.DB
	forum_db    *sql.DB
	shopSkins   map[int]int
	mu          sync.Mutex
	Config      *Config
}

func (s *ApiServer) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Api-Key")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		}

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func NewApiServer(dbFile string, cfg *Config) (*ApiServer, error) {
	accounts_db, err := sql.Open("sqlite3", dbFile)
	if err != nil {
		return nil, err
	}
	server := &ApiServer{
		accounts_db: accounts_db,
		shopSkins:   cfg.Shop.Skins,
		Config:      cfg,
	}
	err = server.DBInit()
	if err != nil {
		return nil, err
	}
	return server, nil
}

func (s *ApiServer) DBInit() error {
	_, err := s.accounts_db.Exec(`
	CREATE TABLE IF NOT EXISTS players (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL,
		inventory TEXT DEFAULT '{"skins":[],"items":{}}',
		score INTEGER DEFAULT 0,
		coins INTEGER DEFAULT 0,
		xp INTEGER DEFAULT 0,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`)
	if err != nil {
		return err
	}

	// open forum database (file from config)
	if s.Config != nil && s.Config.Database.Files.Forum != "" {
		var err2 error
		s.forum_db, err2 = sql.Open("sqlite3", s.Config.Database.Files.Forum)
		if err2 != nil {
			return err2
		}
		_, err2 = s.forum_db.Exec(`
		CREATE TABLE IF NOT EXISTS posts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			author TEXT NOT NULL,
			title TEXT NOT NULL,
			body TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS comments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			post_id INTEGER NOT NULL,
			author TEXT NOT NULL,
			body TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
		);
		`)
		if err2 != nil {
			return err2
		}
	}

	return nil
}

func hashPassword(password string) string {
	h := sha256.New()
	h.Write([]byte(password))
	return hex.EncodeToString(h.Sum(nil))
}

func (s *ApiServer) corsHeaders(w http.ResponseWriter, origin string) {
	w.Header().Set("Access-Control-Allow-Origin", origin)
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
}
func (apiServer *ApiServer) HandleFunctions() {
	mux := http.NewServeMux()
	mux.HandleFunc("/get-regions", apiServer.handleGetRegions)
	mux.HandleFunc("/get-shop", apiServer.handleGetShop)
	mux.HandleFunc("/register", apiServer.handleRegister)
	mux.HandleFunc("/login", apiServer.handleLogin)
	mux.HandleFunc("/get-your-status", apiServer.handleGetYourStatus)
	mux.HandleFunc("/get-status/", apiServer.handleGetStatus)
	mux.HandleFunc("/internal/update-user", apiServer.handleUpdateUser)
	mux.HandleFunc("/buy-skin/", apiServer.handleBuySkin)
	mux.HandleFunc("/leaderboard/", apiServer.handleLeaderboard)

	mux.HandleFunc("/forum/create-post", apiServer.handleCreatePost)
	mux.HandleFunc("/forum/posts/", apiServer.handleListPosts)
	mux.HandleFunc("/forum/post/", apiServer.handlePost)
	mux.HandleFunc("/forum/delete-post/", apiServer.handleDeletePost)
	mux.HandleFunc("/forum/delete-comment/", apiServer.handleDeleteComment)

	handler := apiServer.rateLimitMiddleware(mux)
	handler = apiServer.limitBodySizeMiddleware(handler)
	http.Handle("/", apiServer.corsMiddleware(handler))
}
