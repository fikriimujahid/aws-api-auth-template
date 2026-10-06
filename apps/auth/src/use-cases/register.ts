import { registerWithPassword } from "../services/cognito";

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

export const register = async (input: RegisterInput) => {
  return registerWithPassword(input.email, input.password, input.fullName);
};