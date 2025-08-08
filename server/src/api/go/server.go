package suroimd_api

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"

	_ "github.com/mattn/go-sqlite3"
)

type ApiServer struct {
	db        *sql.DB
	shopSkins map[int]int
	mu        sync.Mutex
	Config    *Config
}

func (s *ApiServer) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Api-Key")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		}

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func NewApiServer(dbFile string, cfg *Config) (*ApiServer, error) {
	db, err := sql.Open("sqlite3", dbFile)
	if err != nil {
		return nil, err
	}
	server := &ApiServer{
		db:        db,
		shopSkins: cfg.Shop.Skins,
		Config:    cfg,
	}
	err = server.DBInit()
	if err != nil {
		return nil, err
	}
	return server, nil
}

func (s *ApiServer) DBInit() error {
	_, err := s.db.Exec(`
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
	return err
}

func hashPassword(password string) string {
	h := sha256.New()
	h.Write([]byte(password))
	return hex.EncodeToString(h.Sum(nil))
}

// --- Handlers ---

func (s *ApiServer) corsHeaders(w http.ResponseWriter, origin string) {
	w.Header().Set("Access-Control-Allow-Origin", origin)
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
}

func (s *ApiServer) handleGetRegions(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s.Config.Regions)
}

func (s *ApiServer) handleGetShop(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s.Config.Shop)
}

func (s *ApiServer) handleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		w.WriteHeader(204)
		return
	}

	var body struct {
		Name     string `json:"name"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON", 400)
		return
	}

	name := strings.TrimSpace(body.Name)
	password := strings.TrimSpace(body.Password)

	if len(name) < 3 || len(password) < 4 {
		http.Error(w, "Name or password too short", 400)
		return
	}

	// Verifica usuário existente
	var existingName string
	err := s.db.QueryRow("SELECT name FROM players WHERE name = ?", name).Scan(&existingName)
	if err != sql.ErrNoRows && err != nil {
		http.Error(w, "Internal error", 500)
		return
	}
	if existingName != "" {
		http.Error(w, "User already exists", 409)
		return
	}

	passwordHash := hashPassword(password)
	_, err = s.db.Exec("INSERT INTO players (name, password_hash) VALUES (?, ?)", name, passwordHash)
	if err != nil {
		http.Error(w, "Internal error", 500)
		return
	}

	log.Println("New account:", name)
	w.WriteHeader(201)
	w.Write([]byte("Registered"))
}

func (s *ApiServer) handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		w.WriteHeader(204)
		return
	}

	var body struct {
		Name     string `json:"name"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON", 400)
		return
	}

	name := strings.TrimSpace(body.Name)
	password := strings.TrimSpace(body.Password)

	var storedHash string
	err := s.db.QueryRow("SELECT password_hash FROM players WHERE name = ?", name).Scan(&storedHash)
	if err == sql.ErrNoRows {
		http.Error(w, "User not found", 404)
		return
	} else if err != nil {
		http.Error(w, "Internal error", 500)
		return
	}

	if storedHash != hashPassword(password) {
		http.Error(w, "Wrong password", 403)
		return
	}

	cookie := http.Cookie{
		Name:     "user",
		Value:    name,
		HttpOnly: true,
		Path:     "/",
	}
	http.SetCookie(w, &cookie)
	w.Header().Set("Content-Type", "text/plain")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Write([]byte("Logged in"))
}

func (s *ApiServer) getUserNameFromCookie(r *http.Request) string {
	cookie, err := r.Cookie("user")
	if err != nil {
		return ""
	}
	return cookie.Value
}

func (s *ApiServer) handleGetYourStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		w.WriteHeader(204)
		return
	}

	username := s.getUserNameFromCookie(r)
	origin := r.Header.Get("Origin")
	s.corsHeaders(w, origin)

	if username == "" {
		http.Error(w, "Not logged in", 401)
		return
	}

	var user struct {
		Name      string `json:"name"`
		Coins     int    `json:"coins"`
		XP        int    `json:"xp"`
		Score     int    `json:"score"`
		Inventory string `json:"inventory"`
	}

	err := s.db.QueryRow("SELECT name, coins, xp, score, inventory FROM players WHERE name = ?", username).
		Scan(&user.Name, &user.Coins, &user.XP, &user.Score, &user.Inventory)
	if err != nil {
		http.Error(w, "User not found", 404)
		return
	}

	resp := map[string]interface{}{"user": user}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (s *ApiServer) handleGetStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		w.WriteHeader(204)
		return
	}

	// URL esperado: /get-status/{username}
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 3 {
		http.Error(w, "Missing username", 400)
		return
	}
	username := parts[2]
	origin := r.Header.Get("Origin")
	s.corsHeaders(w, origin)

	var user struct {
		Name      string `json:"name"`
		Coins     int    `json:"coins"`
		XP        int    `json:"xp"`
		Score     int    `json:"score"`
		Inventory string `json:"inventory"`
	}

	err := s.db.QueryRow("SELECT name, coins, xp, score, inventory FROM players WHERE name = ?", username).
		Scan(&user.Name, &user.Coins, &user.XP, &user.Score, &user.Inventory)
	if err != nil {
		http.Error(w, "User not found", 404)
		return
	}

	resp := map[string]interface{}{"user": user}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (s *ApiServer) handleUpdateUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", 405)
		return
	}

	apiKey := r.Header.Get("x-api-key")
	if apiKey != s.Config.Database.ApiKey {
		http.Error(w, "Unauthorized", 403)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Invalid body", 400)
		return
	}
	defer r.Body.Close()

	var data struct {
		Name  string `json:"name"`
		Coins int    `json:"coins"`
		XP    int    `json:"xp"`
		Score int    `json:"score"`
	}
	if err := json.Unmarshal(body, &data); err != nil {
		http.Error(w, "Invalid JSON", 400)
		return
	}

	if data.Name == "" {
		http.Error(w, "Missing username", 400)
		return
	}

	_, err = s.db.Exec(`
		UPDATE players SET
			coins = coins + ?,
			xp = xp + ?,
			score = score + ?
		WHERE name = ?`, data.Coins, data.XP, data.Score, data.Name)
	if err != nil {
		http.Error(w, "Database error", 500)
		return
	}

	origin := r.Header.Get("Origin")
	s.corsHeaders(w, origin)
	w.Write([]byte("Updated"))
}

func (s *ApiServer) handleBuySkin(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		w.WriteHeader(204)
		return
	}

	username := s.getUserNameFromCookie(r)
	origin := r.Header.Get("Origin")
	s.corsHeaders(w, origin)

	if username == "" {
		http.Error(w, "Not logged in", 401)
		return
	}

	// URL esperado: /buy-skin/{skinId}
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 3 {
		http.Error(w, "Missing skin ID", 400)
		return
	}
	skinID, err := strconv.Atoi(parts[2])
	if err != nil {
		http.Error(w, "Invalid skin ID", 400)
		return
	}

	price, ok := s.shopSkins[skinID]
	if !ok {
		http.Error(w, "Invalid skin ID", 400)
		return
	}

	var player struct {
		Coins     int    `json:"coins"`
		Inventory string `json:"inventory"`
	}

	err = s.db.QueryRow("SELECT coins, inventory FROM players WHERE name = ?", username).Scan(&player.Coins, &player.Inventory)
	if err != nil {
		http.Error(w, "Player not found", 404)
		return
	}

	// Parse inventory JSON
	var inventory struct {
		Skins []int               `json:"skins"`
		Items map[string]struct{} `json:"items"`
	}
	if err := json.Unmarshal([]byte(player.Inventory), &inventory); err != nil {
		inventory = struct {
			Skins []int               `json:"skins"`
			Items map[string]struct{} `json:"items"`
		}{Skins: []int{}, Items: map[string]struct{}{}}
	}

	// Verifica se já tem a skin
	for _, sId := range inventory.Skins {
		if sId == skinID {
			http.Error(w, "Skin already owned", 400)
			return
		}
	}

	if player.Coins < price {
		http.Error(w, "Not enough coins", 400)
		return
	}

	inventory.Skins = append(inventory.Skins, skinID)
	newInventory, _ := json.Marshal(inventory)

	_, err = s.db.Exec("UPDATE players SET coins = coins - ?, inventory = ? WHERE name = ?", price, string(newInventory), username)
	if err != nil {
		http.Error(w, "Database error", 500)
		return
	}

	w.Write([]byte("Skin purchased"))
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

	http.Handle("/", apiServer.corsMiddleware(mux))
}
