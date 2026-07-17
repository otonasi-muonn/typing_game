const fs = require('fs');
const path = require('path');
const assert = require('assert');

// グローバルモックの定義（game.js がブラウザグローバルを参照するため）
global.window = {
  AudioContext: class {
    createBufferSource() {
      return { buffer: null, connect: () => {}, start: () => {} };
    }
    destination = {};
    state = 'suspended';
    resume() {
      this.state = 'running';
      return Promise.resolve();
    }
    decodeAudioData(ab, resolve) { resolve({}); }
  },
  webkitAudioContext: null,
  addEventListener: () => {}
};

// localStorageのモック
const localStorageStore = {};
global.localStorage = {
  getItem: (key) => localStorageStore[key] || null,
  setItem: (key, value) => { localStorageStore[key] = value.toString(); },
  removeItem: (key) => { delete localStorageStore[key]; },
  clear: () => { for (const k in localStorageStore) delete localStorageStore[k]; }
};

// getElementByIdやcreateElementが返すデフォルトのDOM要素モック
class MockElement {
  constructor() {
    this.textContent = '';
    this.innerHTML = '';
    this.value = '';
    const classes = new Set();
    this.classList = {
      add(cls) { classes.add(cls); },
      remove(cls) { classes.delete(cls); },
      contains(cls) { return classes.has(cls); }
    };
  }
  addEventListener(event, cb) {
    this.clickCallback = cb;
  }
  click() {
    if (this.clickCallback) this.clickCallback();
  }
  appendChild(child) {
    // モックのため何もしない
  }
}

global.document = {
  addEventListener: () => {},
  getElementById: (id) => {
    if (!global.document.elements[id]) {
      global.document.elements[id] = new MockElement();
    }
    return global.document.elements[id];
  },
  createElement: (tagName) => {
    return new MockElement();
  },
  elements: {} // プレースホルダー
};

global.performance = {
  now: () => Date.now()
};

// requestAnimationFrame の制御用モック
let activeAnimationFrame = null;
global.requestAnimationFrame = (cb) => {
  activeAnimationFrame = cb;
  return 1;
};
global.cancelAnimationFrame = (id) => {
  activeAnimationFrame = null;
};

global.fetch = (url) => Promise.resolve({
  ok: true,
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  json: () => Promise.resolve([
    { text: "テスト１", kana: "てすとわん" },
    { text: "テスト２", kana: "てすとつー" }
  ])
});

// game.jsの読み込み
const gameJsPath = path.join(__dirname, '../js/game.js');
const gameJsContent = fs.readFileSync(gameJsPath, 'utf8');

// game.jsの末尾にグローバル変数へのバインドを追記して評価
const evalContent = gameJsContent + `
global.TypingEngine = TypingEngine;
global.SoundPlayer = SoundPlayer;
global.QuestionRepository = QuestionRepository;
global.UIController = UIController;
global.GameManager = GameManager;
`;

eval(evalContent);

// ----------------------------------------------------
// テストユーティリティ
// ----------------------------------------------------
const results = [];

function runTest(name, fn) {
  try {
    fn();
    results.push({ name, status: 'PASS', error: null });
  } catch (e) {
    results.push({ name, status: 'FAIL', error: e.stack || e.message });
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    results.push({ name, status: 'PASS', error: null });
  } catch (e) {
    results.push({ name, status: 'FAIL', error: e.stack || e.message });
  }
}

// ----------------------------------------------------
// TypingEngine の単体テスト (かな入力 & DAGロジック)
// ----------------------------------------------------

function testTyping(kana, inputSequence) {
  const engine = new TypingEngine({ text: "テスト", kana: kana });
  let success = true;
  let wordCompleted = false;

  for (let i = 0; i < inputSequence.length; i++) {
    const key = inputSequence[i];
    const res = engine.inputKey(key);
    if (!res.success) {
      success = false;
    }
    wordCompleted = res.wordCompleted;
  }

  return { success, wordCompleted, display: engine.getDisplayData() };
}

runTest("「し」の入力テスト（si / shi）", () => {
  const r1 = testTyping("し", "si");
  assert.strictEqual(r1.success, true, "siでの入力に失敗");
  assert.strictEqual(r1.wordCompleted, true, "siで完了していない");

  const r2 = testTyping("し", "shi");
  assert.strictEqual(r2.success, true, "shiでの入力に失敗");
  assert.strictEqual(r2.wordCompleted, true, "shiで完了していない");
});

runTest("「つ」の入力テスト（tu / tsu）", () => {
  const r1 = testTyping("つ", "tu");
  assert.strictEqual(r1.success, true, "tuでの入力に失敗");
  assert.strictEqual(r1.wordCompleted, true, "tuで完了していない");

  const r2 = testTyping("つ", "tsu");
  assert.strictEqual(r2.success, true, "tsuでの入力に失敗");
  assert.strictEqual(r2.wordCompleted, true, "tsuで完了していない");
});

runTest("「っ」の単体入力テスト（ltu / xtu / ltsu）", () => {
  const r1 = testTyping("っ", "ltu");
  assert.strictEqual(r1.success, true, "ltuでの入力に失敗");
  assert.strictEqual(r1.wordCompleted, true, "ltuで完了していない");

  const r2 = testTyping("っ", "xtu");
  assert.strictEqual(r2.success, true, "xtuでの入力に失敗");
  assert.strictEqual(r2.wordCompleted, true, "xtuで完了していない");
});

runTest("促音「っ」の連続子音入力テスト（「った」 -> tta）", () => {
  const r1 = testTyping("った", "tta");
  assert.strictEqual(r1.success, true, "ttaでの入力に失敗");
  assert.strictEqual(r1.wordCompleted, true, "ttaで完了していない");
});

runTest("「ん」の入力テスト：次の文字が母音・ヤ行以外（「んか」 -> nka）", () => {
  const r1 = testTyping("んか", "nka");
  assert.strictEqual(r1.success, true, "nkaでの入力に失敗");
  assert.strictEqual(r1.wordCompleted, true, "nkaで完了していない");
});

runTest("「ん」の入力テスト：次の文字が母音の場合（「んあ」 -> nna）", () => {
  // nnaはOK
  const r1 = testTyping("んあ", "nna");
  assert.strictEqual(r1.success, true, "nnaでの入力に失敗");
  assert.strictEqual(r1.wordCompleted, true, "nnaで完了していない");

  // naはNG
  const engine = new TypingEngine({ text: "テスト", kana: "んあ" });
  const res1 = engine.inputKey("n");
  assert.strictEqual(res1.success, true, "最初のnは通るはず");
  const res2 = engine.inputKey("a");
  assert.strictEqual(res2.success, false, "2文字目のaはミスになるはず（n+aは「な」になり、「んあ」と合わないため）");
});

runTest("「ん」の入力テスト：次の文字がヤ行の場合（「んや」 -> nnya）", () => {
  // nnyaはOK
  const r1 = testTyping("んや", "nnya");
  assert.strictEqual(r1.success, true, "nnyaでの入力に失敗");
  assert.strictEqual(r1.wordCompleted, true, "nnyaで完了していない");

  // nyaはNG
  const engine = new TypingEngine({ text: "テスト", kana: "んや" });
  const res1 = engine.inputKey("n");
  assert.strictEqual(res1.success, true);
  const res2 = engine.inputKey("y");
  assert.strictEqual(res2.success, false, "nyは「にゃ」系統であり、「んや」にはならないはず");
});

runTest("「ん」の入力テスト：文末の「ん」（単体n禁止、nn/xn必須）", () => {
  // nn は OK
  const r1 = testTyping("ん", "nn");
  assert.strictEqual(r1.success, true, "nnでの入力に失敗");
  assert.strictEqual(r1.wordCompleted, true, "nnで完了していない");

  // xn は OK
  const r2 = testTyping("ん", "xn");
  assert.strictEqual(r2.success, true, "xnでの入力に失敗");
  assert.strictEqual(r2.wordCompleted, true, "xnで完了していない");

  // n 単体は完了しないはず
  const engine = new TypingEngine({ text: "テスト", kana: "ん" });
  const res1 = engine.inputKey("n");
  assert.strictEqual(res1.success, true, "1打鍵目のnは通る");
  assert.strictEqual(res1.wordCompleted, false, "1打鍵目のnでは完了しないはず");
});

runTest("「しゃ」の入力テスト（sya / sha）", () => {
  const r1 = testTyping("しゃ", "sya");
  assert.strictEqual(r1.success, true, "syaでの入力に失敗");
  assert.strictEqual(r1.wordCompleted, true, "syaで完了していない");

  const r2 = testTyping("しゃ", "sha");
  assert.strictEqual(r2.success, true, "shaでの入力に失敗");
  assert.strictEqual(r2.wordCompleted, true, "shaで完了していない");
});

runTest("未定義文字の小文字フォールバック（大文字小文字対応、スペース、記号）", () => {
  // アルファベット「API」に対して「api」で完了するか
  const r1 = testTyping("API", "api");
  assert.strictEqual(r1.success, true, "apiでの入力に失敗");
  assert.strictEqual(r1.wordCompleted, true, "apiで完了していない");

  // 大文字で入力した場合もOK
  const r2 = testTyping("API", "API");
  assert.strictEqual(r2.success, true, "APIでの入力に失敗");
  assert.strictEqual(r2.wordCompleted, true, "APIで完了していない");

  // スペースやハイフン
  const r3 = testTyping("A- B", "a- b");
  assert.strictEqual(r3.success, true, "a- bでの入力に失敗");
  assert.strictEqual(r3.wordCompleted, true, "a- bで完了していない");
});

// ----------------------------------------------------
// 新仕様：「ん」のショートカットエッジ（onnnaなどの不具合解消）の検証
// ----------------------------------------------------

runTest("「ん」のショートカットエッジ：おんな（かな：おんな）", () => {
  // 1. onna で完了するか (o + nna)
  const r1 = testTyping("おんな", "onna");
  assert.strictEqual(r1.success, true, "onnaでの入力に失敗");
  assert.strictEqual(r1.wordCompleted, true, "onnaで完了していない");

  // 2. onnna で完了するか (o + nn + na)
  const r2 = testTyping("おんな", "onnna");
  assert.strictEqual(r2.success, true, "onnnaでの入力に失敗");
  assert.strictEqual(r2.wordCompleted, true, "onnnaで完了していない");

  // 3. oxnna で完了するか (o + xn + na)
  const r3 = testTyping("おんな", "oxnna");
  assert.strictEqual(r3.success, true, "oxnnaでの入力に失敗");
  assert.strictEqual(r3.wordCompleted, true, "oxnnaで完了していない");
});

runTest("「ん」のショートカットエッジ：おんがく（かな：おんがく）", () => {
  // 1. ongaku で完了するか (o + ngaku)
  const r1 = testTyping("おんがく", "ongaku");
  assert.strictEqual(r1.success, true, "ongakuでの入力に失敗");
  assert.strictEqual(r1.wordCompleted, true, "ongakuで完了していない");

  // 2. onngaku で完了するか (o + nn + gaku)
  const r2 = testTyping("おんがく", "onngaku");
  assert.strictEqual(r2.success, true, "onngakuでの入力に失敗");
  assert.strictEqual(r2.wordCompleted, true, "onngakuで完了していない");

  // 3. oxngaku で完了するか (o + xn + gaku)
  const r3 = testTyping("おんがく", "oxngaku");
  assert.strictEqual(r3.success, true, "oxngakuでの入力に失敗");
  assert.strictEqual(r3.wordCompleted, true, "oxngakuで完了していない");
});

// ----------------------------------------------------
// GameManager / UIController (カウントアップタイムトライアル) の統合テスト
// ----------------------------------------------------

runAsyncTest("タイムトライアル動作：ゲーム開始時の初期化 (カウントアップ形式)", async () => {
  global.document.elements = {};
  const soundPlayer = new SoundPlayer();
  const questionRepo = new QuestionRepository();
  const uiController = new UIController();
  const gameManager = new GameManager(soundPlayer, questionRepo, uiController);

  const timerVal = global.document.getElementById("timer-value");
  
  await gameManager.startGame();

  assert.strictEqual(gameManager.gameState, "PLAYING", "ゲームステートがPLAYINGになっていない");
  assert.strictEqual(gameManager.timerStarted, false, "キー入力前にタイマーが始動している");
  assert.strictEqual(timerVal.textContent, "0.00", "開始時のタイマー表示が0.00ではない");
});

runAsyncTest("タイムトライアル動作：タイマーのカウントアップと10問クリアによる終了", async () => {
  global.document.elements = {};
  const soundPlayer = new SoundPlayer();
  const questionRepo = new QuestionRepository();
  const uiController = new UIController();
  const gameManager = new GameManager(soundPlayer, questionRepo, uiController);

  // テスト用問題データ（2問）
  questionRepo.loadQuestions = async () => {
    return [
      { text: "あ", kana: "あ" },
      { text: "い", kana: "い" }
    ];
  };

  let showResultCalled = false;
  let finalStats = null;
  uiController.showResult = (stats) => {
    showResultCalled = true;
    finalStats = stats;
  };
  uiController.showScreen = () => {};

  gameManager.shuffle = (arr) => arr;
  await gameManager.startGame();

  // 最初の正しいキー「a」でタイマー始動
  gameManager.handleKeyPress("a");
  assert.strictEqual(gameManager.timerStarted, true, "キー入力後にタイマーが始動していない");

  // 10ミリ秒後のtick呼び出しをシミュレート
  gameManager.startTime = performance.now() - 5000; // 5秒経過を偽装
  if (activeAnimationFrame) {
    activeAnimationFrame(performance.now());
  }

  const timerVal = global.document.getElementById("timer-value");
  assert.strictEqual(timerVal.textContent, "5.00", "タイマーが5.00にカウントアップされていない");

  // 2問目「い」の「i」を入力してゲームを終了させる
  gameManager.handleKeyPress("i");

  assert.strictEqual(gameManager.gameState, "COMPLETED", "全問クリアしたのにCOMPLETED状態になっていない");
  assert.strictEqual(showResultCalled, true, "結果画面表示メソッドが呼び出されていない");
  assert.strictEqual(finalStats.time, "5.00", "終了時間が5.00秒として集計されていない");
  assert.strictEqual(finalStats.cleared, "2/2", "クリアした問題数が正しく集計されていない");
});

// ----------------------------------------------------
// 全テスト結果の出力
// ----------------------------------------------------
setTimeout(() => {
  console.log("\n=== テスト実行結果 ===");
  let hasFail = false;
  results.forEach(r => {
    console.log(`[${r.status}] ${r.name}`);
    if (r.error) {
      console.error(`      エラー詳細: ${r.error}`);
      hasFail = true;
    }
  });

  if (hasFail) {
    console.error("\n一部のテストが失敗しました。");
    process.exit(1);
  } else {
    console.log("\nすべてのテストが正常にパスしました！");
    process.exit(0);
  }
}, 100);
