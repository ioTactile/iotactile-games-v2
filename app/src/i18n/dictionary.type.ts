import type { Language } from '@/i18n/config';

export type Dictionary = {
  common: {
    appName: string;
    loading: string;
    back: string;
    close: string;
  };
  languageSwitcher: {
    label: (language: Language) => string;
  };
  auth: {
    login: string;
  };
  home: {
    title: string;
    subtitle: string;
    playCta: string;
  };
  games: {
    dice: {
      description: string;
    };
    minesweeper: {
      description: string;
    };
  };
  minesweeper: {
    title: string;
    intro: string;
    play: string;
    backToHome: string;
    statusWaiting: string;
    statusPlaying: string;
    statusPause: string;
    statusWon: string;
    statusLost: string;
    difficultyBeginner: string;
    difficultyIntermediate: string;
    difficultyExpert: string;
    difficultyCustom: string;
    customWidth: string;
    customHeight: string;
    customMines: string;
    customSubmit: string;
    newGame: string;
  };
  dice: {
    title: string;
    intro: string;
    statusWaiting: string;
    statusPlaying: string;
    statusFinished: string;
    createSectionTitle: string;
    createNamePlaceholder: string;
    createDisplayNamePlaceholder: string;
    createIsPublicLabel: string;
    createSubmitIdle: string;
    createSubmitLoading: string;
    joinSectionTitle: string;
    joinHelp: string;
    joinCodePlaceholder: string;
    joinDisplayNamePlaceholder: string;
    joinSubmitIdle: string;
    joinSubmitLoading: string;
    errorMissingName: string;
    errorMissingDisplayName: string;
    errorMissingCode: string;
    publicSessionsTitle: string;
    publicSessionsDescription: string;
    mySessionsTitle: string;
    backToHome: string;
    loadingLobby: string;
    loadingSession: string;
    sessionNotFound: string;
    backToMenu: string;
    waitingForPlayersLabel: string;
    shareCodeHelp: string;
    copy: string;
    copied: string;
    startGame: string;
    startingGame: string;
    leave: string;
    leaving: string;
    gameOverMessage: string;
    rollDice: string;
    rollDiceButtonLabel: (triesLeft: number) => string;
    diceFaceLabel: (face: number, locked: boolean) => string;
    selectDiceLabel: (face: number) => string;
    showRules: string;
    rulesTitle: string;
    rulesDescription: string;
    bonus35Description: string;
    understood: string;
    soundToggleLabel: (muted: boolean) => string;
  };
};
