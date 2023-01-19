import { Entry } from 'har-format';

export default async (req: Entry) => {
  try {
    return /\{"products":\[/.test(req.response.content.text ?? '');
  } catch {
    return false;
  }
};
