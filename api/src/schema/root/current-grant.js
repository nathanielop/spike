export default {
  type: { nullable: 'grant' },
  resolve: async ({ context: { grant } }) => grant
};
