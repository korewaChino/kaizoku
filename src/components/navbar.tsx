import {
  Badge,
  Box,
  createStyles,
  Divider,
  Grid,
  Image,
  MantineColor,
  Navbar,
  ScrollArea,
  SimpleGrid,
  Skeleton,
  Text,
  Timeline,
  Tooltip,
} from '@mantine/core';
import {
  IconActivity,
  IconAlertTriangle,
  IconCalendarStats,
  IconCircleCheck,
  IconClock,
  IconFileReport,
  IconRefreshAlert,
} from '@tabler/icons-react';
import { inferProcedureOutput } from '@trpc/server';
import dayjs from 'dayjs';
import prettyBytes from 'pretty-bytes';

import { NextLink } from '@mantine/next';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ReactNode, useEffect, useState } from 'react';
import { AppRouter } from '../server/trpc/router';
import { trpc } from '../utils/trpc';
import { MadeWith } from './madeWith';

dayjs.extend(relativeTime);

const useStyles = createStyles((theme) => ({
  navbar: {
    paddingTop: 0,
    boxShadow: theme.shadows.md,
    fontSize: theme.fontSizes.xs,
    [`@media (max-width: ${theme.breakpoints.sm}px)`]: {
      display: 'none',
    },
  },
  history: {
    textDecoration: 'none',
  },
  badge: {
    padding: 5,
    minWidth: 20,
    pointerEvents: 'none',
  },
  activity: {
    display: 'block',
    textDecoration: 'none',
    paddingLeft: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    color: theme.colorScheme === 'dark' ? theme.colors.gray[5] : theme.colors.gray[8],

    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.gray[9] : theme.colors.gray[0],
    },
  },
}));

function NavBarSkeleton() {
  return (
    <Box>
      <Skeleton height={10} width="100%" mb={10} radius="xl" />
      <Skeleton height={10} width={150} mb={10} radius="xl" />
      <Skeleton height={10} width={180} mb={10} radius="xl" />
      <Skeleton height={10} width={120} mb={10} radius="xl" />
    </Box>
  );
}
type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
  ? ElementType
  : never;

type HistoryType = inferProcedureOutput<AppRouter['manga']['history']>;
type HistoryItemType = ArrayElement<inferProcedureOutput<AppRouter['manga']['history']>>;

function HistoryItemTitle({ chapter }: { chapter: HistoryItemType }) {
  const { classes } = useStyles();
  return (
    <Grid gutter={5}>
      <Grid.Col span="content" style={{ maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden' }}>
        <Tooltip inline label={chapter.manga.title} position="right" withinPortal withArrow>
          <Text weight={600}>{chapter.manga.title}</Text>
        </Tooltip>
      </Grid.Col>
      <Grid.Col span="auto">
        <Divider mt="xs" variant="dotted" />
      </Grid.Col>
      <Grid.Col span="content">
        <Badge size="sm" variant="light" color="indigo" className={classes.badge}>
          #{chapter.index + 1}
        </Badge>
      </Grid.Col>
    </Grid>
  );
}

function HistoryItem({ chapter }: { chapter: HistoryItemType }) {
  const [time, setTime] = useState(dayjs(chapter.createdAt).fromNow());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(dayjs(chapter.createdAt).fromNow());
    }, 60000);
    return () => {
      clearInterval(intervalId);
    };
  });

  return (
    <>
      <Text color="dimmed" size="xs" weight={500} style={{ wordBreak: 'break-word' }}>
        A new chapter downloaded as{' '}
        <Text size="xs" weight={600}>
          {chapter.fileName}
        </Text>
      </Text>
      <SimpleGrid cols={2} mt={4}>
        <Tooltip label={time}>
          <Badge variant="light" size="xs" color="cyan" leftSection={<IconClock size={12} />}>
            {time}
          </Badge>
        </Tooltip>
        <Badge variant="light" size="xs" color="violet" leftSection={<IconFileReport size={12} />}>
          {prettyBytes(chapter.size)}
        </Badge>
      </SimpleGrid>
    </>
  );
}

function History({ data }: { data: HistoryType }) {
  const { classes } = useStyles();

  return (
    <Timeline lineWidth={2} className={classes.history}>
      {data.map((chapter) => {
        return (
          <Timeline.Item
            key={chapter.id}
            lineVariant="dotted"
            bullet={<Image mt={20} alt="header" src={chapter.manga.metadata.cover} height={40} width={26} />}
            title={<HistoryItemTitle chapter={chapter} />}
          >
            <HistoryItem chapter={chapter} />
          </Timeline.Item>
        );
      })}
    </Timeline>
  );
}

function ActivityItem({
  name,
  icon,
  count,
  href,
  onClick,
  color,
}: {
  name: string;
  icon: ReactNode;
  count: number;
  href?: string;
  onClick?: () => void;
  color: MantineColor;
}) {
  const { classes } = useStyles();

  return (
    <NextLink
      target="_blank"
      href={href || '#'}
      className={classes.activity}
      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <Grid gutter={5}>
        <Grid.Col span="content" style={{ display: 'flex', alignItems: 'center' }}>
          {icon}
          <Text ml={5} component="span" inline weight={600}>
            {name}
          </Text>
        </Grid.Col>
        <Grid.Col span="auto" />
        <Grid.Col span="content">
          <Badge size="md" variant="dot" color={color} className={classes.badge}>
            {count}
          </Badge>
        </Grid.Col>
      </Grid>
    </NextLink>
  );
}

ActivityItem.defaultProps = {
  href: undefined,
  onClick: undefined,
};

type ActivityType = inferProcedureOutput<AppRouter['manga']['activity']>;

function Activity({ data }: { data: ActivityType }) {
  return (
    <>
      <ActivityItem
        icon={<IconActivity size={20} strokeWidth={1.5} />}
        name="Active"
        color="teal"
        count={data.active}
        href="/bull/queues/queue/downloadQueue?status=active"
      />
      <ActivityItem
        icon={<IconClock size={20} strokeWidth={1.5} />}
        name="Queued"
        color="cyan"
        count={data.queued}
        href="/bull/queues/queue/downloadQueue?status=waiting"
      />
      <ActivityItem
        icon={<IconCalendarStats size={20} strokeWidth={1.5} />}
        name="Scheduled"
        color="yellow"
        count={data.scheduled}
        href="/bull/queues/queue/checkChaptersQueue?status=delayed"
      />
      <ActivityItem
        icon={<IconAlertTriangle size={20} strokeWidth={1.5} />}
        name="Failed"
        color="red"
        count={data.failed}
        href="/bull/queues/queue/downloadQueue?status=failed"
      />
      <ActivityItem
        icon={<IconCircleCheck size={20} strokeWidth={1.5} />}
        name="Completed"
        color="dark"
        count={data.completed}
        href="/bull/queues/queue/downloadQueue?status=completed"
      />
      <ActivityItem
        icon={<IconRefreshAlert size={20} strokeWidth={1.5} />}
        name="Out of Sync"
        color="violet"
        count={data.outOfSync}
        onClick={() => {}}
      />
    </>
  );
}

export function KaizokuNavbar() {
  const { classes } = useStyles();

  const historyQuery = trpc.manga.history.useQuery(undefined, {
    refetchInterval: 5 * 1000,
  });
  const activityQuery = trpc.manga.activity.useQuery(undefined, {
    refetchInterval: 5 * 1000,
  });
  const libraryQuery = trpc.library.query.useQuery();

  if (!libraryQuery.data) {
    return null;
  }

  return (
    <Navbar width={{ sm: 300 }} p="md" pb={0} className={classes.navbar} fixed>
      <Navbar.Section>
        <Divider
          mb="md"
          labelPosition="left"
          variant="solid"
          label={
            <Text color="dimmed" size="md" weight={500}>
              Activities
            </Text>
          }
        />
        {activityQuery.isLoading && <NavBarSkeleton />}
        {activityQuery.data && <Activity data={activityQuery.data} />}
      </Navbar.Section>

      <Divider
        mb="md"
        labelPosition="left"
        mt="md"
        variant="solid"
        label={
          <Text color="dimmed" size="md" weight={500}>
            Latest Downloads
          </Text>
        }
      />
      <Navbar.Section grow component={ScrollArea}>
        {historyQuery.isLoading && <NavBarSkeleton />}
        <Box mx={8}>{historyQuery.data && <History data={historyQuery.data} />}</Box>
      </Navbar.Section>
      <Divider mt="sm" variant="dotted" />
      <Navbar.Section sx={{ display: 'flex', justifyContent: 'center' }}>
        <MadeWith minimized={false} />
      </Navbar.Section>
    </Navbar>
  );
}
