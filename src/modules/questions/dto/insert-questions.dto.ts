export class InsertQuestionDto {
  apiQuestionId!: string;
  question!: string;
  options!: any[];
  apiSubjectName!: string;
  subject: any;
  answer?: string;
  examType?: string;
  examYear?: string;
  explanation?: string;
}
