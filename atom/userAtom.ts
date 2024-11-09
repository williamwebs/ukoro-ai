import { atomWithStorage } from "jotai/utils";
import type { User } from "firebase/auth";

export const userAtom = atomWithStorage<User | null>("user", null);
