/**
 * ローマ字変換定義マップ
 * 一般的な日本語入力の揺れをカバーするための定義
 */
const ROMAN_MAP = {
  // 1文字の変換
  "あ": ["a"], "い": ["i", "yi"], "う": ["u", "wu", "whu"], "え": ["e", "ye"], "お": ["o"],
  "か": ["ka"], "き": ["ki"], "く": ["ku"], "け": ["ke"], "こ": ["ko"],
  "さ": ["sa"], "し": ["si", "shi"], "す": ["su"], "せ": ["se"], "そ": ["so"],
  "た": ["ta"], "ち": ["ti", "chi"], "つ": ["tu", "tsu"], "て": ["te"], "と": ["to"],
  "な": ["na"], "に": ["ni"], "ぬ": ["nu"], "ね": ["ne"], "の": ["no"],
  "は": ["ha"], "ひ": ["hi"], "ふ": ["hu", "fu"], "へ": ["he"], "ほ": ["ho"],
  "ま": ["ma"], "み": ["mi"], "む": ["mu"], "め": ["me"], "も": ["mo"],
  "や": ["ya"], "ゆ": ["yu"], "よ": ["yo"],
  "ら": ["ra"], "り": ["ri"], "る": ["ru"], "れ": ["re"], "ろ": ["ro"],
  "わ": ["wa"], "を": ["wo"], "ん": ["nn", "xn"],
  "が": ["ga"], "ぎ": ["gi"], "ぐ": ["gu"], "げ": ["ge"], "ご": ["go"],
  "ざ": ["za"], "じ": ["zi", "ji"], "ず": ["zu"], "ぜ": ["ze"], "ぞ": ["zo"],
  "だ": ["da"], "ぢ": ["di"], "づ": ["du"], "で": ["de"], "ど": ["do"],
  "ば": ["ba"], "び": ["bi"], "ぶ": ["bu"], "べ": ["be"], "ぼ": ["bo"],
  "ぱ": ["pa"], "ぴ": ["pi"], "ぷ": ["pu"], "ぺ": ["pe"], "ぽ": ["po"],
  "ぁ": ["la", "xa"], "ぃ": ["li", "xi"], "ぅ": ["lu", "xu"], "ぇ": ["le", "xe"], "ぉ": ["lo", "xo"],
  "ゃ": ["lya", "xya"], "ゅ": ["lyu", "xyu"], "ょ": ["lyo", "xyo"], "っ": ["ltu", "xtu", "ltsu"],
  "ー": ["-"],
  "、": [","], "。": ["."],
  // 2文字の変換（拗音・特殊音）
  "きゃ": ["kya"], "きぃ": ["kyi"], "きゅ": ["kyu"], "きぇ": ["kye"], "きょ": ["kyo"],
  "しゃ": ["sya", "sha"], "しぃ": ["syi"], "しゅ": ["syu", "shu"], "しぇ": ["sye", "she"], "しょ": ["syo", "sho"],
  "ちゃ": ["tya", "cha"], "ちぃ": ["tyi"], "ちゅ": ["tyu", "chu"], "ちぇ": ["tye", "che"], "ちょ": ["tyo", "cho"],
  "にゃ": ["nya"], "にぃ": ["nyi"], "にゅ": ["nyu"], "にぇ": ["nye"], "にょ": ["nyo"],
  "ひゃ": ["hya"], "ひぃ": ["hyi"], "ひゅ": ["hyu"], "ひぇ": ["hye"], "ひょ": ["hyo"],
  "みゃ": ["mya"], "みぃ": ["myi"], "みゅ": ["myu"], "みぇ": ["mye"], "みょ": ["myo"],
  "りゃ": ["rya"], "りぃ": ["ryi"], "りゅ": ["ryu"], "りぇ": ["rye"], "りょ": ["ryo"],
  "ぎゃ": ["gya"], "ぎぃ": ["gyi"], "ぎゅ": ["gyu"], "ぎぇ": ["gye"], "ぎょ": ["gyo"],
  "じゃ": ["zya", "ja", "jya"], "じぃ": ["zyi", "jyi"], "じゅ": ["zyu", "ju", "jya"], "じぇ": ["zye", "je", "jye"], "じょ": ["zyo", "jo", "jyo"],
  "ぢゃ": ["dya"], "ぢぃ": ["dyi"], "ぢゅ": ["dyu"], "ぢぇ": ["dye"], "ぢょ": ["dyo"],
  "びゃ": ["bya"], "びぃ": ["byi"], "びゅ": ["byu"], "びぇ": ["bye"], "びょ": ["byo"],
  "ぴゃ": ["pya"], "ぴぃ": ["pyi"], "ぴゅ": ["pyu"], "ぴぇ": ["pye"], "ぴょ": ["pyo"],
  "ふぁ": ["fa", "fua"], "ふぃ": ["fi", "fyi", "fui"], "ふぇ": ["fe", "fye", "fue"], "ふょ": ["fyo"], "ふぉ": ["fo", "fuo"],
  "うぁ": ["wha"], "うぃ": ["wi", "whi"], "うぇ": ["we", "whe"], "うぉ": ["who"],
  "てぃ": ["thi"], "てゅ": ["thu"], "てぇ": ["the"],
  "でぃ": ["dhi"], "でゅ": ["dhu"], "でぇ": ["dhe"],
  "つぁ": ["tsa"], "つぃ": ["tsi"], "つぇ": ["tse"], "つぉ": ["tso"],
  "ヴぁ": ["va"], "ヴぃ": ["vi", "vyi"], "ヴ": ["vu"], "ヴぇ": ["ve", "vye"], "ヴぉ": ["vo"],
};

/**
 * ローマ字判定エンジン (DAGによる実装)
 */
class TypingEngine {
  constructor(question) {
    this.question = question; // { text: "日本語", kana: "よみがな" }
    this.kana = this.toHiragana(question.kana);
    this.nodes = []; // 各インデックスのノードから出るエッジリスト
    this.currentNode = 0; // 現在到達しているグラフのノード
    this.activeEdges = []; // 現在進行中の入力候補エッジ
    this.history = ""; // これまでに確定した入力済みローマ字

    this.buildDAG();
    this.resetActiveEdges();
  }

  /**
   * カタカナをひらがなに変換するユーティリティ
   */
  toHiragana(str) {
    return str.replace(/[\u30a1-\u30f6]/g, m => String.fromCharCode(m.charCodeAt(0) - 0x60));
  }

  /**
   * ひらがな文字列から有向非巡回グラフ(DAG)を構築する
   */
  buildDAG() {
    const N = this.kana.length;
    this.nodes = Array.from({ length: N + 1 }, () => []);

    const vowels = ['a', 'i', 'u', 'e', 'o', 'y', 'n', '-'];

    for (let i = 0; i < N; i++) {
      // 1. 通常の変換 (2文字拗音または1文字)
      // 2文字チェック
      if (i + 1 < N) {
        const target2 = this.kana.slice(i, i + 2);
        if (ROMAN_MAP[target2]) {
          for (const r of ROMAN_MAP[target2]) {
            this.nodes[i].push({ start: i, end: i + 2, label: r });
          }
        }
      }
      // 1文字チェック
      const target1 = this.kana[i];
      if (ROMAN_MAP[target1]) {
        for (const r of ROMAN_MAP[target1]) {
          this.nodes[i].push({ start: i, end: i + 1, label: r });
        }
      } else {
        // ROMAN_MAPに定義されていない文字は小文字化してフォールバック登録
        this.nodes[i].push({ start: i, end: i + 1, label: target1.toLowerCase() });
      }

      // 2. 促音「っ」の特殊処理 (次の文字の先頭子音を重ねるエッジを動的に追加)
      if (target1 === 'っ' && i + 1 < N) {
        // 次の文字が拗音(2文字)の場合
        if (i + 2 < N) {
          const next2 = this.kana.slice(i + 1, i + 3);
          if (ROMAN_MAP[next2]) {
            for (const r of ROMAN_MAP[next2]) {
              const c = r[0];
              if (!vowels.includes(c)) {
                this.nodes[i].push({ start: i, end: i + 3, label: c + r });
              }
            }
          }
        }
        // 次の文字が1文字の場合
        const next1 = this.kana[i + 1];
        if (ROMAN_MAP[next1]) {
          for (const r of ROMAN_MAP[next1]) {
            const c = r[0];
            if (!vowels.includes(c)) {
              this.nodes[i].push({ start: i, end: i + 2, label: c + r });
            }
          }
        }
      }

      // 3. 撥音「ん」の特殊処理 (次の文字の先頭が母音・y以外の場合の『n + 次の文字のローマ字』ショートカットエッジを動的に追加)
      if (target1 === 'ん' && i + 1 < N) {
        const forbidden = ['a', 'i', 'u', 'e', 'o', 'y'];
        
        // 次の文字が拗音(2文字)の場合の先読み
        if (i + 2 < N) {
          const next2 = this.kana.slice(i + 1, i + 3);
          if (ROMAN_MAP[next2]) {
            for (const r of ROMAN_MAP[next2]) {
              const c = r[0];
              if (!forbidden.includes(c)) {
                this.nodes[i].push({ start: i, end: i + 3, label: 'n' + r });
              }
            }
          }
        }
        
        // 次の文字が1文字の場合の先読み
        const next1 = this.kana[i + 1];
        if (ROMAN_MAP[next1]) {
          for (const r of ROMAN_MAP[next1]) {
            const c = r[0];
            if (!forbidden.includes(c)) {
              this.nodes[i].push({ start: i, end: i + 2, label: 'n' + r });
            }
          }
        }
      }
    }
  }

  /**
   * 現在のノードから出るエッジでアクティブな候補を初期化/リセットする
   */
  resetActiveEdges() {
    const edges = this.nodes[this.currentNode] || [];
    this.activeEdges = edges.map(edge => ({
      edge: edge,
      typedLength: 0
    }));
  }

  /**
   * ユーザーからのキー入力を処理する
   * @param {string} key 
   * @returns {Object} { success: boolean, wordCompleted: boolean }
   */
  inputKey(key) {
    const lowerKey = key.toLowerCase();

    // 次の文字がマッチするエッジを抽出
    const matched = this.activeEdges.filter(ae => ae.edge.label[ae.typedLength] === lowerKey);

    if (matched.length === 0) {
      // ミス入力
      return { success: false, wordCompleted: false };
    }

    // マッチしたエッジの進行を進める
    for (const ae of matched) {
      ae.typedLength += 1;
    }

    const ongoing = matched.filter(ae => ae.typedLength < ae.edge.label.length);
    const completedList = matched.filter(ae => ae.typedLength === ae.edge.label.length);

    if (completedList.length > 0) {
      // 完了したエッジの中で、最も終点（end）が進んでいるものを代表として採用する
      completedList.sort((a, b) => b.edge.end - a.edge.end);
      const completed = completedList[0];

      // 完成したエッジの文字履歴を確定し、ノードを進める
      this.history += completed.edge.label;
      this.currentNode = completed.edge.end;

      if (this.currentNode === this.kana.length) {
        // 単語全体の入力完了
        return { success: true, wordCompleted: true };
      } else {
        // 次のノードに進むが、現在進行中のより長いエッジ（ongoing）も引き継いでマージする
        const nextActiveEdges = [...ongoing];
        const newEdges = this.nodes[this.currentNode] || [];
        const newActive = newEdges.map(edge => ({ edge, typedLength: 0 }));
        
        // 重複を排除してマージ
        for (const na of newActive) {
          if (!nextActiveEdges.some(ae => ae.edge.start === na.edge.start && ae.edge.end === na.edge.end && ae.edge.label === na.edge.label)) {
            nextActiveEdges.push(na);
          }
        }

        this.activeEdges = nextActiveEdges;
        return { success: true, wordCompleted: false };
      }
    } else {
      // 入力継続中。候補をマッチしたものに絞り込む
      this.activeEdges = ongoing;
      return { success: true, wordCompleted: false };
    }
  }

  /**
   * UI表示用のローマ字分割データを取得する
   * @returns {Object} { typed: string, current: string, remaining: string }
   */
  getDisplayData() {
    // 指定したノードからゴールまでのデフォルト（最短/最優先）パスを取得
    const getDefaultPathFrom = (startNode) => {
      let pathStr = "";
      let curr = startNode;
      const N = this.kana.length;
      while (curr < N) {
        const edges = this.nodes[curr];
        if (!edges || edges.length === 0) break;
        const bestEdge = edges[0]; // 最優先エッジ
        pathStr += bestEdge.label;
        curr = bestEdge.end;
      }
      return pathStr;
    };

    if (this.activeEdges.length === 0) {
      return { typed: this.history, current: "", remaining: "" };
    }

    // 最も優先度の高いアクティブエッジを基準にする
    const activeInfo = this.activeEdges[0];
    const edge = activeInfo.edge;
    const len = activeInfo.typedLength;

    const typed = this.history + edge.label.slice(0, len);
    const current = edge.label[len] || "";
    const remaining = edge.label.slice(len + 1) + getDefaultPathFrom(edge.end);

    return { typed, current, remaining };
  }
}

/**
 * 効果音再生プレイヤー (Web Audio API)
 */
class SoundPlayer {
  constructor() {
    this.audioCtx = null;
    this.audioBuffer = null;
    this.isSoundEnabled = false;
  }

  /**
   * ユーザーアクションに応じてAudioContextを初期化/再開する
   */
  async init() {
    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        console.warn("Web Audio API is not supported in this browser.");
        return;
      }
      this.audioCtx = new AudioContextClass();
      await this.loadSound();
    } catch (e) {
      console.error("Failed to initialize AudioContext, playing in silent mode:", e);
      this.isSoundEnabled = false;
    }
  }

  /**
   * 音声ファイルを非同期でロードする (NFC/NFDの両方のエンコーディングパスを試行するフォールバック機能付き)
   */
  async loadSound() {
    const baseName = "タイピング-パンタグラフ単1.mp3";
    // NFD (濁点が分解されている形式) と NFC の両方でfetchを試みる
    const urls = [
      baseName.normalize("NFC"),
      baseName.normalize("NFD")
    ];

    let response = null;
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          response = res;
          break;
        }
      } catch (e) {
        console.warn(`Failed to fetch sound from: ${url}`, e);
      }
    }

    if (!response) {
      throw new Error("Could not load sound file from any normalizations (NFC/NFD).");
    }

    const arrayBuffer = await response.arrayBuffer();
    // decodeAudioDataの例外処理をラップ
    this.audioBuffer = await new Promise((resolve, reject) => {
      this.audioCtx.decodeAudioData(arrayBuffer, resolve, reject);
    });
    this.isSoundEnabled = true;
    console.log("Sound loaded successfully.");
  }

  /**
   * 打鍵音を瞬時に再生する (連打に対応するため都度SourceNodeを生成)
   */
  play() {
    if (!this.isSoundEnabled || !this.audioBuffer || !this.audioCtx) return;
    try {
      const source = this.audioCtx.createBufferSource();
      source.buffer = this.audioBuffer;
      source.connect(this.audioCtx.destination);
      source.start(0);
    } catch (e) {
      console.warn("Failed to play sound instance:", e);
    }
  }
}

/**
 * 問題リポジトリ (Fetch処理 ＆ ローカルフォールバックデータ ＆ LocalStorage永続化)
 */
class QuestionRepository {
  constructor() {
    // Fetch失敗時に使用するIT用語のフォールバックデータ (20件)
    this.fallbackQuestions = [
      { "text": "バグ", "kana": "ばぐ" },
      { "text": "マージリクエスト", "kana": "まーじりくえすと" },
      { "text": "もくもく会", "kana": "もくもくかい" },
      { "text": "クラウド", "kana": "くらうど" },
      { "text": "API", "kana": "えーぴーあい" },
      { "text": "コンパイル", "kana": "こんぱいる" },
      { "text": "リファクタリング", "kana": "りふぁくたりんぐ" },
      { "text": "デプロイ", "kana": "でぷろい" },
      { "text": "ブランチ", "kana": "ぶらんち" },
      { "text": "オープンソース", "kana": "おーぷんそーす" },
      { "text": "コンテナ", "kana": "こんてな" },
      { "text": "サーバー", "kana": "さーばー" },
      { "text": "データベース", "kana": "でーたべーす" },
      { "text": "インフラ", "kana": "いんふら" },
      { "text": "セキュリティ", "kana": "せきゅりてぃ" },
      { "text": "アジャイル", "kana": "あじゃいる" },
      { "text": "フロントエンド", "kana": "ふろんとえんど" },
      { "text": "バックエンド", "kana": "ばっくえんど" },
      { "text": "コミット", "kana": "こみっと" },
      { "text": "プルリクエスト", "kana": "ぷるりくえすと" }
    ];
    // 濁点の結合形式を標準形式に強制変換してフォールバックデータを正規化
    this.fallbackQuestions.forEach(q => {
      q.kana = q.kana.normalize("NFC");
    });

    this.questionsKey = "typing_game_questions";
    this.limitKey = "typing_game_question_limit";
    this.questions = [];
  }

  /**
   * LocalStorageから問題をロードし、失敗した場合はFetch ➔ フォールバックデータを返す
   */
  async loadQuestions() {
    // 1. LocalStorageにすでにデータがあるか確認
    const stored = localStorage.getItem(this.questionsKey);
    if (stored) {
      try {
        this.questions = JSON.parse(stored);
        if (Array.isArray(this.questions) && this.questions.length > 0) {
          return this.questions;
        }
      } catch (e) {
        console.warn("Failed to parse stored questions, reloading...", e);
      }
    }

    // 2. なければ questions.json からFetch
    try {
      const response = await fetch("questions.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.questions = await response.json();
    } catch (e) {
      console.warn("Failed to fetch questions.json. Using fallback questions.", e);
      this.questions = [...this.fallbackQuestions];
    }

    // 3. 一度LocalStorageに保存して返す
    this.saveToStorage();
    return this.questions;
  }

  /**
   * 問題データをLocalStorageに保存
   */
  saveToStorage() {
    localStorage.setItem(this.questionsKey, JSON.stringify(this.questions));
  }

  /**
   * 新しい問題を追加
   */
  addQuestion(text, kana) {
    this.questions.push({ text, kana: kana.normalize("NFC") });
    this.saveToStorage();
  }

  /**
   * 問題を削除
   */
  deleteQuestion(index) {
    if (index >= 0 && index < this.questions.length) {
      this.questions.splice(index, 1);
      this.saveToStorage();
    }
  }

  /**
   * 出題上限問題数の取得 (デフォルトは10問)
   */
  getQuestionLimit() {
    const limit = localStorage.getItem(this.limitKey);
    return limit ? parseInt(limit, 10) : 10;
  }

  /**
   * 出題上限問題数を保存
   */
  setQuestionLimit(limit) {
    localStorage.setItem(this.limitKey, limit.toString());
  }

  getFallbackQuestions() {
    return this.fallbackQuestions;
  }
}

/**
 * UI表示制御コントローラー
 */
class UIController {
  constructor() {
    // 画面要素
    this.screens = {
      IDLE: document.getElementById("screen-idle"),
      PLAYING: document.getElementById("screen-playing"),
      COMPLETED: document.getElementById("screen-completed")
    };

    // プレイ画面の要素
    this.timerVal = document.getElementById("timer-value");
    this.correctVal = document.getElementById("correct-value");
    this.missVal = document.getElementById("miss-value");
    this.clearedVal = document.getElementById("cleared-value");
    this.questionText = document.getElementById("question-text");
    this.romajiTyped = document.getElementById("romaji-typed");
    this.romajiCurrent = document.getElementById("romaji-current");
    this.romajiRemaining = document.getElementById("romaji-remaining");
    this.gameContainer = document.getElementById("game-container");

    // リザルト画面の要素
    this.resTime = document.getElementById("res-time");
    this.resWpm = document.getElementById("res-sps"); // ID変更に追従 (SPS)
    this.resAccuracy = document.getElementById("res-accuracy");
    this.resCorrect = document.getElementById("res-correct");
    this.resMiss = document.getElementById("res-miss");
    this.resCleared = document.getElementById("res-cleared");

    // ボタン
    this.btnStart = document.getElementById("btn-start");
    this.btnRestart = document.getElementById("btn-restart");

    // 設定・管理モーダル関連のDOM
    this.modalSettings = document.getElementById("modal-settings");
    this.btnOpenSettings = document.getElementById("btn-open-settings");
    this.btnCloseSettings = document.getElementById("btn-close-settings");
    
    this.inputQuestionLimit = document.getElementById("input-question-limit");
    this.inputNewText = document.getElementById("input-new-text");
    this.inputNewKana = document.getElementById("input-new-kana");
    this.btnAddQuestion = document.getElementById("btn-add-question");
    
    this.questionsCount = document.getElementById("questions-count");
    this.settingsQuestionsList = document.getElementById("settings-questions-list");
    this.settingsWarning = document.getElementById("settings-warning");
  }

  /**
   * 指定した画面のみをアクティブにし、他を非表示にする
   */
  showScreen(state) {
    Object.keys(this.screens).forEach(key => {
      if (key === state) {
        this.screens[key].classList.add("active");
      } else {
        this.screens[key].classList.remove("active");
      }
    });
  }

  bindStartButton(callback) {
    if (this.btnStart) {
      this.btnStart.addEventListener("click", callback);
    }
  }

  bindRestartButton(callback) {
    if (this.btnRestart) {
      this.btnRestart.addEventListener("click", callback);
    }
  }

  /**
   * タイマー値を小数点2桁でリアルタイム更新する
   */
  updateTimer(time) {
    if (this.timerVal) {
      this.timerVal.textContent = time.toFixed(2);
    }
  }

  /**
   * プレイ画面の統計値を更新する
   */
  updateStats(correct, miss, clearedStr, timeStr) {
    if (this.correctVal) this.correctVal.textContent = correct;
    if (this.missVal) this.missVal.textContent = miss;
    if (this.clearedVal) this.clearedVal.textContent = clearedStr;
    if (this.timerVal && timeStr !== undefined) {
      this.timerVal.textContent = timeStr;
    }
  }

  /**
   * 問題の日本語テキストとガイド用ローマ字表示を更新する
   */
  updateQuestion(text, romajiData) {
    if (this.questionText) {
      this.questionText.textContent = text;
    }
    this.updateRomaji(romajiData);
  }

  /**
   * ガイド用ローマ字表示（入力済み、現在入力中、未入力）を更新する
   */
  updateRomaji(romajiData) {
    if (this.romajiTyped) this.romajiTyped.textContent = romajiData.typed;
    if (this.romajiCurrent) this.romajiCurrent.textContent = romajiData.current;
    if (this.romajiRemaining) this.romajiRemaining.textContent = romajiData.remaining;
  }

  /**
   * ミス入力時の赤枠ネオンフラッシュエフェクトをトリガーする
   */
  flashMissEffect() {
    if (this.gameContainer) {
      this.gameContainer.classList.remove("miss-flash");
      // リフローを起こしてCSSアニメーションを再度最初からトリガーする
      void this.gameContainer.offsetWidth;
      this.gameContainer.classList.add("miss-flash");
    }
  }

  /**
   * 終了時の結果データをリザルト画面の各要素に反映する
   */
  showResult(stats) {
    if (this.resTime) this.resTime.textContent = stats.time + "秒";
    if (this.resWpm) this.resWpm.textContent = stats.sps; // WPMからSPS表示に変更
    if (this.resAccuracy) this.resAccuracy.textContent = stats.accuracy + "%";
    if (this.resCorrect) this.resCorrect.textContent = stats.correct;
    if (this.resMiss) this.resMiss.textContent = stats.miss;
    if (this.resCleared) this.resCleared.textContent = stats.cleared;
  }
}

/**
 * キーボード入力イベント監視クラス
 */
class InputListener {
  constructor(gameManager) {
    this.gameManager = gameManager;
  }

  /**
   * キーボードのkeydownイベントの監視を開始する
   */
  init() {
    window.addEventListener("keydown", (e) => {
      // 日本語入力(IME)変換中は無視
      if (e.isComposing) return;

      // プレイ中以外は無視
      if (this.gameManager.gameState !== "PLAYING") return;

      // 修飾キー（Ctrl, Alt, Meta）との組み合わせ入力は判定対象外とする
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // 1文字の入力（英数字・記号など）である場合のみ判定を試行
      if (e.key.length === 1) {
        this.gameManager.handleKeyPress(e.key);
      }
    });
  }
}

/**
 * 全体のゲームフローおよび時間・統計を管理するゲームマネージャー
 */
class GameManager {
  constructor(soundPlayer, questionRepository, uiController) {
    this.soundPlayer = soundPlayer;
    this.questionRepo = questionRepository;
    this.ui = uiController;

    this.gameState = "IDLE"; // "IDLE" | "PLAYING" | "COMPLETED"

    this.questions = [];
    this.currentQuestionIndex = 0;
    this.currentEngine = null;

    // タイマー関連
    this.startTime = 0;
    this.elapsedTime = 0;
    this.timerId = null;
    this.timerStarted = false;

    // 統計関連
    this.correctCount = 0;
    this.missCount = 0;

    // 設定関連
    this.questionLimit = 10;
  }

  /**
   * 初期化処理 (スタートボタンおよびリスタートボタンのクリックイベントのバインド)
   */
  async init() {
    this.ui.showScreen("IDLE");
    this.ui.bindStartButton(async () => {
      // ユーザーの最初の操作時にAudioContextを開始する (ブラウザポリシー対策)
      await this.soundPlayer.init();
      await this.startGame();
    });
    this.ui.bindRestartButton(() => {
      this.startGame();
    });

    // 起動時に問題を一度ロードしてLocalStorageと同期
    await this.questionRepo.loadQuestions();
    
    // 設定モーダルのバインド
    this.bindSettingsEvents();
  }

  /**
   * 設定モーダルおよび問題追加・削除の各イベントをバインドする
   */
  bindSettingsEvents() {
    // モーダルを開く
    if (this.ui.btnOpenSettings) {
      this.ui.btnOpenSettings.addEventListener("click", () => {
        this.openSettingsModal();
      });
    }
    // モーダルを閉じる
    if (this.ui.btnCloseSettings) {
      this.ui.btnCloseSettings.addEventListener("click", () => {
        this.closeSettingsModal();
      });
    }
    // モーダルの外側クリックで閉じる
    if (this.ui.modalSettings) {
      this.ui.modalSettings.addEventListener("click", (e) => {
        if (e.target === this.ui.modalSettings) {
          this.closeSettingsModal();
        }
      });
    }
    // 出題数設定のロードと変更時の保存
    if (this.ui.inputQuestionLimit) {
      this.ui.inputQuestionLimit.value = this.questionRepo.getQuestionLimit();
      this.ui.inputQuestionLimit.addEventListener("change", (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 10;
        this.questionRepo.setQuestionLimit(val);
        this.updateSettingsWarning();
      });
    }
    // 問題追加ボタン
    if (this.ui.btnAddQuestion) {
      this.ui.btnAddQuestion.addEventListener("click", () => {
        this.handleAddQuestion();
      });
    }
  }

  /**
   * モーダルを開き、登録問題一覧をレンダリングする
   */
  openSettingsModal() {
    this.updateQuestionsListUI();
    this.updateSettingsWarning();
    if (this.ui.modalSettings) {
      this.ui.modalSettings.classList.add("active");
    }
  }

  /**
   * モーダルを閉じる
   */
  closeSettingsModal() {
    if (this.ui.modalSettings) {
      this.ui.modalSettings.classList.remove("active");
    }
  }

  /**
   * 登録問題の一覧UIを動的に再描画する
   */
  updateQuestionsListUI() {
    if (!this.ui.settingsQuestionsList || !this.ui.questionsCount) return;
    this.ui.settingsQuestionsList.innerHTML = "";
    
    const questions = this.questionRepo.questions;
    this.ui.questionsCount.textContent = questions.length;

    questions.forEach((q, idx) => {
      const li = document.createElement("li");
      
      const details = document.createElement("div");
      details.className = "q-details";
      
      const qText = document.createElement("span");
      qText.className = "q-text";
      qText.textContent = q.text;
      
      const qKana = document.createElement("span");
      qKana.className = "q-kana";
      qKana.textContent = q.kana;
      
      details.appendChild(qText);
      details.appendChild(qKana);
      
      const btnDelete = document.createElement("button");
      btnDelete.className = "btn-delete";
      btnDelete.textContent = "削除";
      btnDelete.addEventListener("click", () => {
        this.handleDeleteQuestion(idx);
      });
      
      li.appendChild(details);
      li.appendChild(btnDelete);
      
      this.ui.settingsQuestionsList.appendChild(li);
    });
  }

  /**
   * 設定された出題数と実際の登録問題数の乖離に応じた警告文表示の制御
   */
  updateSettingsWarning() {
    if (!this.ui.settingsWarning) return;
    const limit = this.questionRepo.getQuestionLimit();
    const count = this.questionRepo.questions.length;
    
    if (count < limit) {
      this.ui.settingsWarning.textContent = `警告: 登録問題数 (${count}問) が設定された出題数 (${limit}問) より少ないため、重複して出題される可能性があります。`;
      this.ui.settingsWarning.classList.remove("hidden");
    } else {
      this.ui.settingsWarning.textContent = "";
      this.ui.settingsWarning.classList.add("hidden");
    }
  }

  /**
   * 新しい問題を追加
   */
  handleAddQuestion() {
    if (!this.ui.inputNewText || !this.ui.inputNewKana) return;
    
    const text = this.ui.inputNewText.value.trim();
    const kana = this.ui.inputNewKana.value.trim();

    if (!text || !kana) {
      this.showValidationError("日本語表示とよみがなの両方を入力してください。");
      return;
    }

    // よみがなのバリデーション: ひらがな、長音(ー)、読点類のみを許容する
    const kanaRegex = /^[ぁ-んー、。？！\?\!]+$/;
    if (!kanaRegex.test(kana)) {
      this.showValidationError("よみがなは『ひらがな・長音(ー)・読点類』のみで入力してください。（漢字や英数字、カタカナは入力不可）");
      return;
    }

    // 重複登録のチェック
    const isDuplicate = this.questionRepo.questions.some(q => q.text === text && q.kana === kana);
    if (isDuplicate) {
      this.showValidationError("この問題は既に登録されています。");
      return;
    }

    // 保存処理とUIのリセット
    this.questionRepo.addQuestion(text, kana);
    this.ui.inputNewText.value = "";
    this.ui.inputNewKana.value = "";
    
    this.showValidationError(""); // 警告エリアのリセットまたは初期警告への更新
    this.updateQuestionsListUI();
    this.updateSettingsWarning();
  }

  /**
   * 問題の削除
   */
  handleDeleteQuestion(index) {
    this.questionRepo.deleteQuestion(index);
    this.updateQuestionsListUI();
    this.updateSettingsWarning();
  }

  /**
   * バリデーション警告の表示
   */
  showValidationError(msg) {
    if (!this.ui.settingsWarning) return;
    if (msg) {
      this.ui.settingsWarning.textContent = msg;
      this.ui.settingsWarning.classList.remove("hidden");
    } else {
      this.updateSettingsWarning();
    }
  }

  /**
   * ゲームを開始する (問題データのロード、タイマーのリセット、画面の切り替え)
   */
  async startGame() {
    this.stopTimer(); // 重複防止のためにタイマーを確実に停止
    this.questionLimit = this.questionRepo.getQuestionLimit();

    try {
      const allQuestions = await this.questionRepo.loadQuestions();
      // シャッフルして設定された問題数分を取得
      this.questions = this.shuffle(allQuestions).slice(0, this.questionLimit);
    } catch (e) {
      console.error("Failed to load questions. Using fallback.", e);
      this.questions = this.shuffle(this.questionRepo.getFallbackQuestions()).slice(0, this.questionLimit);
    }

    this.currentQuestionIndex = 0;
    this.correctCount = 0;
    this.missCount = 0;
    this.gameState = "PLAYING";
    this.timerStarted = false;
    this.elapsedTime = 0;

    this.ui.updateStats(0, 0, `0/${this.questions.length}`, "0.00");
    this.nextQuestion();
    this.ui.showScreen("PLAYING");
  }

  /**
   * 配列をシャッフルするユーティリティ (Fisher-Yatesシャッフル)
   */
  shuffle(arr) {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  }

  /**
   * 次の問題をセットする。全問終了していた場合はゲーム終了処理へ移行
   */
  nextQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.endGame();
      return;
    }

    const question = this.questions[this.currentQuestionIndex];
    this.currentEngine = new TypingEngine(question);

    this.ui.updateQuestion(question.text, this.currentEngine.getDisplayData());
    
    this.ui.updateStats(
      this.correctCount, 
      this.missCount, 
      `${this.currentQuestionIndex}/${this.questions.length}`, 
      this.elapsedTime.toFixed(2)
    );
  }

  /**
   * タイマーを開始する (requestAnimationFrameによるミリ秒単位カウントアップ)
   */
  startTimer() {
    this.timerStarted = true;
    this.startTime = performance.now();

    const tick = (now) => {
      if (this.gameState !== "PLAYING") return;
      this.elapsedTime = (now - this.startTime) / 1000;
      this.ui.updateTimer(this.elapsedTime);
      this.timerId = requestAnimationFrame(tick);
    };
    this.timerId = requestAnimationFrame(tick);
  }

  /**
   * タイマーを停止する
   */
  stopTimer() {
    if (this.timerId) {
      cancelAnimationFrame(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * 打鍵キー判定のハンドリング。最初の正しいキー入力時にタイマーを起動する。
   * @param {string} key 
   */
  handleKeyPress(key) {
    if (this.gameState !== "PLAYING" || !this.currentEngine) return;

    const result = this.currentEngine.inputKey(key);

    if (result.success) {
      this.correctCount++;

      // 最初の正しい打鍵時にタイマーを開始する
      if (!this.timerStarted) {
        this.startTimer();
      }

      // 効果音を再生
      this.soundPlayer.play();

      if (result.wordCompleted) {
        this.currentQuestionIndex++;
        this.nextQuestion();
      } else {
        this.ui.updateRomaji(this.currentEngine.getDisplayData());
        this.ui.updateStats(
          this.correctCount, 
          this.missCount, 
          `${this.currentQuestionIndex}/${this.questions.length}`, 
          this.elapsedTime.toFixed(2)
        );
      }
    } else {
      // 不正解時のミスカウントおよび視覚効果のトリガー
      this.missCount++;
      this.ui.flashMissEffect();
      this.ui.updateStats(
        this.correctCount, 
        this.missCount, 
        `${this.currentQuestionIndex}/${this.questions.length}`, 
        this.elapsedTime.toFixed(2)
      );
    }
  }

  /**
   * 全問完了時のゲーム終了処理。タイマーを停止し、リザルトに必要な統計値を算出
   */
  endGame() {
    this.gameState = "COMPLETED";
    this.stopTimer();

    const time = this.elapsedTime;
    // SPS = 正解キー打鍵数 / クリア秒数 (ゼロ除算/極小値対策として 0.01秒以下は SPS=0)
    const sps = time > 0.01 ? (this.correctCount / time).toFixed(2) : "0.00";
    // 正確性 = 正解打鍵数 / (正解打鍵数 + ミス打鍵数) * 100
    const totalHits = this.correctCount + this.missCount;
    const accuracy = totalHits > 0 ? Math.round((this.correctCount / totalHits) * 100) : 0;

    const stats = {
      time: time.toFixed(2),
      sps: sps, // WPMからSPSに変更
      accuracy: accuracy,
      correct: this.correctCount,
      miss: this.missCount,
      cleared: `${this.currentQuestionIndex}/${this.questions.length}`
    };

    this.ui.showResult(stats);
    this.ui.showScreen("COMPLETED");
  }
}

// ページロード完了時にゲームコンポーネントを初期化・接続する
document.addEventListener("DOMContentLoaded", () => {
  const soundPlayer = new SoundPlayer();
  const questionRepo = new QuestionRepository();
  const uiController = new UIController();
  const gameManager = new GameManager(soundPlayer, questionRepo, uiController);
  const inputListener = new InputListener(gameManager);

  inputListener.init();
  gameManager.init();
});
