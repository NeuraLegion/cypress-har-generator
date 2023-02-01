import { Entry } from 'har-format';

export default async (entry: Entry) => {
  try {
    return /\{"products":\[/.test(entry.response.content.text ?? '');
  } catch {
    return false;
  }
};
