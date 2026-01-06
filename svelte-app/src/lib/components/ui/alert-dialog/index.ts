import { Dialog as AlertDialogPrimitive } from 'bits-ui';

import Root from './alert-dialog.svelte';
import Action from './alert-dialog-action.svelte';
import Cancel from './alert-dialog-cancel.svelte';
import Portal from './alert-dialog-portal.svelte';
import Overlay from './alert-dialog-overlay.svelte';
import Content from './alert-dialog-content.svelte';
import Header from './alert-dialog-header.svelte';
import Footer from './alert-dialog-footer.svelte';
import Title from './alert-dialog-title.svelte';
import Description from './alert-dialog-description.svelte';
import Trigger from './alert-dialog-trigger.svelte';

export {
  Root,
  Action,
  Cancel,
  Portal,
  Overlay,
  Content,
  Header,
  Footer,
  Title,
  Description,
  Trigger,
  //
  Root as AlertDialog,
  Action as AlertDialogAction,
  Cancel as AlertDialogCancel,
  Portal as AlertDialogPortal,
  Overlay as AlertDialogOverlay,
  Content as AlertDialogContent,
  Header as AlertDialogHeader,
  Footer as AlertDialogFooter,
  Title as AlertDialogTitle,
  Description as AlertDialogDescription,
  Trigger as AlertDialogTrigger
};
