const repeat = {
  until<T>(
    fn: () => T | Promise<T>,
    until: () => boolean | Promise<boolean>
  ): Promise<void> {
    return Promise.resolve()
      .then(fn)
      .then(until)
      .then(predicate =>
        predicate ? Promise.resolve() : repeat.until(fn, until)
      );
  },
  while<T>(
    fn: () => T | Promise<T>,
    wwhile: () => boolean | Promise<boolean>
  ): Promise<void> {
    return Promise.resolve()
      .then(fn)
      .then(wwhile)
      .then(predicate =>
        predicate ? repeat.while(fn, wwhile) : Promise.resolve()
      );
  },
};

export default repeat;
