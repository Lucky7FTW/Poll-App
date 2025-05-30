// poll-texts.interface.ts
export interface PollTexts {
  title: string;

  questionLabel: string;
  questionPh: string;
  questionError: string;
  descriptionLabel: string;
  descriptionPh: string;
  optionsLabel: string;
  addOption: string;
  removeOption: string;
  optionPh: string;
  atLeastTwo: string;

  scheduleLabel: string;
  startDateLabel: string;
  startDateHelp: string;
  endDateLabel: string;
  endDateHelp: string;
  startDatePastError: string;
  endDateBeforeStartError: string;

  settingsLabel: string;
  allowMultiple: string;
  isPrivate: string;
  submitIdle: string;
  submitBusy: string;
  mustLogin: string;
  genericError: string;
}
