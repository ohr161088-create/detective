import { type PropsWithChildren } from 'react';
import { AppsInToss } from '@apps-in-toss/framework';
import { context } from '../require.context';

function AppContainer({ children }: PropsWithChildren) {
  return <>{children}</>;
}

export default AppsInToss.registerApp(AppContainer, {
  context,
});
