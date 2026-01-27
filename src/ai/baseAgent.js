export class BaseAgent {
  constructor({ name, llm }) {
    this.name = name;
    this.llm = llm;
  }

  async think(prompt) {
    const response = await this.llm.invoke(prompt);
    return response.content;
  }
}
